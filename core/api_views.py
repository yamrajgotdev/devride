from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Ride, Driver, Customer, RideLocation
from .utils import distance, generate_otp, calculate_fare, autocomplete_address, geocode_address, get_distance_matrix, send_sms_otp, get_route
from django.utils import timezone
import secrets


def _get_auth_customer(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.replace("Bearer ", "", 1).strip()
    if not token:
        return None
    try:
        return Customer.objects.get(auth_token=token, is_active=True, is_verified=True)
    except Customer.DoesNotExist:
        return None


@api_view(['POST'])
@permission_classes([AllowAny])
def request_ride_api(request):
    try:
        mobile = request.data.get('mobile')
        pickup = request.data.get('pickup')
        drop = request.data.get('drop')
        vehicle_type = request.data.get('vehicle_type', 'mini')
        pickup_lat = request.data.get('pickup_lat')
        pickup_lng = request.data.get('pickup_lng')
        drop_lat = request.data.get('drop_lat')
        drop_lng = request.data.get('drop_lng')
        distance_km = float(request.data.get('distance_km', 0))

        if not all([mobile, pickup, drop]):
            return Response({'status': 'error', 'message': 'Missing required fields'}, status=400)

        customer, created = Customer.objects.get_or_create(
            mobile=mobile,
            defaults={'name': f'Customer_{mobile}', 'is_verified': True}
        )

        if pickup_lat and pickup_lng and drop_lat and drop_lng:
            pickup_lat, pickup_lng = float(pickup_lat), float(pickup_lng)
            drop_lat, drop_lng = float(drop_lat), float(drop_lng)
        else:
            pickup_lat, pickup_lng = geocode_address(pickup)
            drop_lat, drop_lng = geocode_address(drop)

        if pickup_lat and drop_lat:
            distance_km = distance(pickup_lat, pickup_lng, drop_lat, drop_lng)

        fare = calculate_fare(distance_km, vehicle_type)
        otp = generate_otp()

        ride = Ride.objects.create(
            customer=customer,
            pickup_location=pickup,
            drop_location=drop,
            vehicle_type=vehicle_type,
            pickup_lat=pickup_lat or 0,
            pickup_lng=pickup_lng or 0,
            drop_lat=drop_lat or 0,
            drop_lng=drop_lng or 0,
            distance_km=distance_km,
            price=fare,
            fare=fare,
            otp=otp,
            status='requested'
        )

        RideLocation.objects.create(
            ride=ride,
            pickup_lat=pickup_lat or 0,
            pickup_lon=pickup_lng or 0,
            drop_lat=drop_lat or 0,
            drop_lon=drop_lng or 0
        )

        nearby_drivers = find_nearby_drivers(pickup_lat, pickup_lng, vehicle_type)

        return Response({
            'status': 'success',
            'ride_id': ride.id,
            'otp': otp,
            'distance_km': round(distance_km, 2),
            'fare': fare,
            'pickup_lat': pickup_lat,
            'pickup_lng': pickup_lng,
            'drop_lat': drop_lat,
            'drop_lng': drop_lng,
            'nearby_drivers_count': len(nearby_drivers)
        })
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=500)


def find_nearby_drivers(lat, lng, vehicle_type=None, radius_km=10):
    drivers = Driver.objects.filter(is_online=True, is_verified=True)
    if vehicle_type:
        drivers = drivers.filter(vehicle_type=vehicle_type)
    
    nearby = []
    for driver in drivers:
        if driver.current_lat and driver.current_lng:
            dist = distance(lat, lng, driver.current_lat, driver.current_lng)
            if dist <= radius_km:
                nearby.append({
                    'id': driver.id,
                    'name': driver.name,
                    'distance': round(dist, 2)
                })
    
    nearby.sort(key=lambda x: x['distance'])
    return nearby


@api_view(['GET'])
@permission_classes([AllowAny])
def address_autocomplete_api(request):
    query = request.GET.get('q')
    if not query:
        return Response({"predictions": []})

    predictions = autocomplete_address(query)
    return Response({"predictions": predictions})


@api_view(['POST'])
@permission_classes([AllowAny])
def calculate_distance_api(request):
    pickup_lat = request.data.get('pickup_lat')
    pickup_lng = request.data.get('pickup_lng')
    drop_lat = request.data.get('drop_lat')
    drop_lng = request.data.get('drop_lng')
    vehicle_type = request.data.get('vehicle_type', 'mini')

    if not all([pickup_lat, pickup_lng, drop_lat, drop_lng]):
        return Response({'status': 'error', 'message': 'Missing coordinates'}, status=400)

    pickup_lat, pickup_lng = float(pickup_lat), float(pickup_lng)
    drop_lat, drop_lng = float(drop_lat), float(drop_lng)

    route_data = get_route(pickup_lat, pickup_lng, drop_lat, drop_lng)

    if route_data and route_data.get('distance_km'):
        dist = route_data['distance_km']
        route_coords = route_data.get('geometry', [])
        duration = route_data.get('duration_minutes', int(dist * 3))
        if isinstance(duration, float):
            duration = int(duration)
    else:
        # Haversine is straight-line; multiply by 1.35 road-factor for realistic distance
        straight_line = distance(pickup_lat, pickup_lng, drop_lat, drop_lng)
        dist = round(straight_line * 1.35, 2)
        route_coords = generate_route_points(pickup_lat, pickup_lng, drop_lat, drop_lng)
        # avg speed ~25 km/h in local areas
        duration = max(1, int((dist / 25) * 60))

    fare = calculate_fare(dist, vehicle_type)

    return Response({
        'distance_km': round(dist, 2),
        'estimated_fare': round(fare, 2),
        'vehicle_type': vehicle_type,
        'route': route_coords,
        'duration_minutes': duration
    })


def generate_route_points(lat1, lng1, lat2, lng2, num_points=10):
    points = []
    for i in range(num_points + 1):
        t = i / num_points
        lat = lat1 + (lat2 - lat1) * t
        lng = lng1 + (lng2 - lng1) * t
        points.append([round(lng, 6), round(lat, 6)])
    return points


@api_view(['GET'])
@permission_classes([AllowAny])
def get_ride_status_api(request, ride_id):
    try:
        ride = Ride.objects.get(id=ride_id)
        return Response({
            'ride_id': ride.id,
            'status': ride.status,
            'pickup': ride.pickup_location,
            'drop': ride.drop_location,
            'driver': None if not ride.driver else {
                'id': ride.driver.id,
                'name': ride.driver.name,
                'mobile': ride.driver.mobile
            }
        })
    except Ride.DoesNotExist:
        return Response({'status': 'error', 'message': 'Ride not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def cancel_ride_api(request, ride_id):
    try:
        ride = Ride.objects.get(id=ride_id)
        if ride.status in ['completed', 'cancelled']:
            return Response({'status': 'error', 'message': 'Ride cannot be cancelled'}, status=400)
        
        ride.status = 'cancelled'
        ride.save()
        return Response({'status': 'success', 'message': 'Ride cancelled'})
    except Ride.DoesNotExist:
        return Response({'status': 'error', 'message': 'Ride not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def accept_ride_api(request, ride_id):
    try:
        driver_id = request.data.get('driver_id')
        if not driver_id:
            return Response({'status': 'error', 'message': 'Driver ID required'}, status=400)

        ride = Ride.objects.get(id=ride_id)
        if ride.status != 'requested':
            return Response({'status': 'error', 'message': 'Ride not available'}, status=400)

        driver = Driver.objects.get(id=driver_id)
        if not driver.is_online:
            return Response({'status': 'error', 'message': 'Driver not online'}, status=400)

        ride.driver = driver
        ride.status = 'accepted'
        ride.save()

        return Response({'status': 'success', 'message': 'Ride accepted'})
    except Ride.DoesNotExist:
        return Response({'status': 'error', 'message': 'Ride not found'}, status=404)
    except Driver.DoesNotExist:
        return Response({'status': 'error', 'message': 'Driver not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def start_ride_api(request, ride_id):
    try:
        ride = Ride.objects.get(id=ride_id)
        if ride.status != 'accepted':
            return Response({'status': 'error', 'message': 'Ride not accepted'}, status=400)
        
        ride.status = 'ongoing'
        ride.save()
        return Response({'status': 'success', 'message': 'Ride started'})
    except Ride.DoesNotExist:
        return Response({'status': 'error', 'message': 'Ride not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_ride_api(request, ride_id):
    try:
        ride = Ride.objects.get(id=ride_id)
        if ride.status != 'ongoing':
            return Response({'status': 'error', 'message': 'Ride not in progress'}, status=400)
        
        ride.status = 'completed'
        ride.save()
        if ride.customer:
            ride.customer.total_rides += 1
            ride.customer.save(update_fields=['total_rides'])
        
        if ride.driver:
            ride.driver.is_online = True
            ride.driver.save()

        return Response({
            'status': 'success',
            'message': 'Ride completed',
            'total_fare': ride.fare
        })
    except Ride.DoesNotExist:
        return Response({'status': 'error', 'message': 'Ride not found'}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def nearby_drivers_api(request):
    try:
        lat = float(request.GET.get('lat', 0))
        lng = float(request.GET.get('lng', 0))
        radius_km = float(request.GET.get('radius', 5))
        vehicle_type = request.GET.get('vehicle_type')

        if not lat or not lng:
            return Response({'status': 'error', 'message': 'lat and lng required'}, status=400)

        drivers = Driver.objects.filter(is_online=True, is_verified=True)
        if vehicle_type:
            drivers = drivers.filter(vehicle_type=vehicle_type)

        nearby = []
        for driver in drivers:
            if driver.current_lat and driver.current_lng:
                dist = distance(lat, lng, driver.current_lat, driver.current_lng)
                if dist <= radius_km:
                    nearby.append({
                        'id': driver.id,
                        'name': driver.name,
                        'lat': driver.current_lat,
                        'lng': driver.current_lng,
                        'vehicle_type': driver.vehicle_type,
                        'distance': round(dist, 2),
                    })

        nearby.sort(key=lambda x: x['distance'])
        return Response({'drivers': nearby, 'count': len(nearby)})
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def pricing_api(request):
    base_fare = {'bike': 15, 'porter': 25}
    per_km_rate = {'bike': 8, 'porter': 14}
    return Response({
        'pricing': [
            {'vehicle_type': 'bike', 'base_fare': base_fare['bike'], 'per_km': per_km_rate['bike']},
            {'vehicle_type': 'porter', 'base_fare': base_fare['porter'], 'per_km': per_km_rate['porter']},
        ]
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def available_rides_api(request):
    rides = Ride.objects.filter(status='requested').order_by('-created_at')
    data = []
    for ride in rides:
        data.append({
            'id': ride.id,
            'pickup': ride.pickup_location,
            'drop': ride.drop_location,
            'pickup_lat': ride.pickup_lat,
            'pickup_lng': ride.pickup_lng,
            'drop_lat': ride.drop_lat,
            'drop_lng': ride.drop_lng,
            'vehicle_type': ride.vehicle_type,
            'distance_km': ride.distance_km,
            'estimated_fare': ride.price
        })
    return Response({'rides': data})


@api_view(['GET'])
@permission_classes([AllowAny])
def driver_rides_api(request, driver_id):
    try:
        driver = Driver.objects.get(id=driver_id)
        rides = Ride.objects.filter(driver=driver).order_by('-created_at')
        data = []
        for ride in rides:
            data.append({
                'id': ride.id,
                'pickup': ride.pickup_location,
                'drop': ride.drop_location,
                'status': ride.status,
                'price': ride.price,
                'distance_km': ride.distance_km,
                'customer_mobile': ride.customer.mobile if ride.customer else None,
                'otp': ride.otp if ride.status != 'completed' else None
            })
        return Response({'rides': data})
    except Driver.DoesNotExist:
        return Response({'status': 'error', 'message': 'Driver not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def driver_update_location_api(request, driver_id):
    try:
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        
        if not lat or not lng:
            return Response({'status': 'error', 'message': 'Coordinates required'}, status=400)

        driver = Driver.objects.get(id=driver_id)
        driver.current_lat = float(lat)
        driver.current_lng = float(lng)
        driver.save()
        
        return Response({'status': 'success'})
    except Driver.DoesNotExist:
        return Response({'status': 'error', 'message': 'Driver not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def driver_toggle_status_api(request, driver_id):
    try:
        driver = Driver.objects.get(id=driver_id)
        driver.is_online = not driver.is_online
        driver.save()
        return Response({
            'status': 'success',
            'is_online': driver.is_online
        })
    except Driver.DoesNotExist:
        return Response({'status': 'error', 'message': 'Driver not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp_api(request):
    mobile = request.data.get('mobile')
    if not mobile:
        return Response({'success': False, 'status': 'error', 'message': 'Mobile required'}, status=400)
    
    otp = generate_otp()
    
    try:
        customer = Customer.objects.get(mobile=mobile)
        customer.otp = otp
        customer.save()
    except Customer.DoesNotExist:
        customer = Customer.objects.create(
            mobile=mobile,
            name=f'Customer_{mobile}',
            otp=otp
        )
    
    send_sms_otp(mobile, otp)
    
    return Response({
        'success': True,
        'status': 'success',
        'message': 'OTP sent! Check terminal for OTP.',
        'otp_printed': True
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_api(request):
    mobile = request.data.get('mobile')
    otp = request.data.get('otp')
    
    if not mobile or not otp:
        return Response({'success': False, 'status': 'error', 'message': 'Mobile and OTP required'}, status=400)
    
    try:
        customer = Customer.objects.get(mobile=mobile, otp=otp)
        customer.is_verified = True
        customer.otp = None
        customer.last_login = timezone.now()
        customer.auth_token = secrets.token_hex(32)
        customer.save()
        return Response({
            'success': True,
            'status': 'success',
            'message': 'Verified',
            'customer_id': customer.id,
            'token': customer.auth_token,
        })
    except Customer.DoesNotExist:
        return Response({'success': False, 'status': 'error', 'message': 'Invalid OTP'}, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def user_profile_api(request):
    customer = _get_auth_customer(request)
    if not customer:
        return Response({'status': 'error', 'message': 'Unauthorized'}, status=401)
    return Response({
        'phone_number': customer.mobile,
        'total_rides': customer.total_rides,
        'member_since': customer.created_at,
        'last_login': customer.last_login,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def user_rides_api(request):
    customer = _get_auth_customer(request)
    if not customer:
        return Response({'status': 'error', 'message': 'Unauthorized'}, status=401)
    rides = Ride.objects.filter(customer=customer).select_related('driver').order_by('-created_at')
    response_rides = []
    for ride in rides:
        response_rides.append({
            'pickup': ride.pickup_location,
            'destination': ride.drop_location,
            'fare': ride.fare,
            'driver_name': ride.driver.name if ride.driver else 'Not assigned',
            'date': ride.created_at,
            'ride_status': ride.status,
        })
    return Response({
        'total_rides': rides.count(),
        'rides': response_rides,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_feedback_api(request, ride_id):
    try:
        ride = Ride.objects.get(id=ride_id)
        rating = request.data.get('rating', 5)
        comment = request.data.get('comment', '')
        
        from .models import Feedback
        feedback = Feedback.objects.create(
            ride=ride,
            rating=rating,
            comment=comment
        )
        
        return Response({'status': 'success', 'message': 'Feedback submitted'})
    except Ride.DoesNotExist:
        return Response({'status': 'error', 'message': 'Ride not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def driver_register_api(request):
    try:
        mobile = request.data.get('mobile')
        full_name = request.data.get('full_name')
        driving_license = request.data.get('driving_license')
        aadhaar_number = request.data.get('aadhaar_number')
        pan_number = request.data.get('pan_number')
        rc_number = request.data.get('rc_number')
        number_plate = request.data.get('number_plate')
        otp = request.data.get('otp')

        if not all([mobile, full_name, driving_license, aadhaar_number, pan_number, rc_number, number_plate]):
            return Response({'status': 'error', 'message': 'Missing required fields'}, status=400)

        try:
            driver = Driver.objects.get(mobile=mobile)
            if driver.otp and str(driver.otp) == str(otp):
                driver.name = full_name
                driver.driving_license = driving_license
                driver.aadhaar_number = aadhaar_number
                driver.pan_number = pan_number
                driver.rc_number = rc_number
                driver.vehicle_number = number_plate
                driver.otp = None
                driver.is_verified = False
                driver.save()
            else:
                return Response({'status': 'error', 'message': 'Invalid OTP'}, status=400)
        except Driver.DoesNotExist:
            driver = Driver.objects.create(
                mobile=mobile,
                name=full_name,
                driving_license=driving_license,
                aadhaar_number=aadhaar_number,
                pan_number=pan_number,
                rc_number=rc_number,
                vehicle_number=number_plate,
                is_verified=False,
                is_online=False
            )

        return Response({
            'status': 'success',
            'message': 'Driver registration submitted for verification',
            'driver_id': driver.id
        })
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def driver_send_otp_api(request):
    mobile = request.data.get('mobile')
    if not mobile:
        return Response({'status': 'error', 'message': 'Mobile required'}, status=400)
    
    otp = generate_otp()
    
    try:
        driver = Driver.objects.get(mobile=mobile)
        driver.otp = otp
        driver.save()
    except Driver.DoesNotExist:
        driver = Driver.objects.create(
            mobile=mobile,
            name=f'Driver_{mobile}',
            otp=otp,
            is_verified=False,
            is_online=False
        )
    
    print(f"\n{'='*50}")
    print(f"DRIVER OTP for +91{mobile}: {otp}")
    print(f"{'='*50}\n")
    
    return Response({
        'status': 'success',
        'message': 'OTP sent! Check terminal for OTP.',
        'otp_printed': True
    })
