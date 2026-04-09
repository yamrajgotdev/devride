from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
from .models import Ride, Driver, Customer, RideLocation
from .utils import distance, generate_otp, calculate_fare


MIME_TYPES = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
}


def _mime(path):
    ext = os.path.splitext(path)[1].lower()
    return MIME_TYPES.get(ext, 'application/octet-stream')


def frontend_index(request):
    index_path = os.path.join(settings.BASE_DIR, 'static', 'frontend', 'dist', 'index.html')
    return FileResponse(open(index_path, 'rb'), content_type='text/html')


def serve_static_assets(request, path):
    from django.http import Http404
    asset_path = os.path.join(settings.BASE_DIR, 'static', 'frontend', 'dist', 'assets', path)
    if os.path.exists(asset_path):
        return FileResponse(open(asset_path, 'rb'), content_type=_mime(asset_path))
    raise Http404("Asset not found")


def serve_dist_file(request, filename):
    from django.http import Http404
    file_path = os.path.join(settings.BASE_DIR, 'static', 'frontend', 'dist', filename)
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), content_type=_mime(file_path))
    raise Http404("File not found")


@csrf_exempt
def request_ride(request):
    if request.method == 'POST':
        try:
            mobile = request.POST.get('mobile')
            pickup = request.POST.get('pickup')
            drop = request.POST.get('drop')
            vehicle_type = request.POST.get('vehicle_type', 'mini')
            pickup_lat = request.POST.get('pickup_lat')
            pickup_lng = request.POST.get('pickup_lng')
            drop_lat = request.POST.get('drop_lat')
            drop_lng = request.POST.get('drop_lng')
            distance_km = float(request.POST.get('distance', 0))

            customer, created = Customer.objects.get_or_create(
                mobile=mobile,
                defaults={'name': f'Customer_{mobile}', 'is_verified': True}
            )

            if pickup_lat:
                pickup_lat = float(pickup_lat)
                pickup_lng = float(pickup_lng)
                drop_lat = float(drop_lat)
                drop_lng = float(drop_lng)
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

            return redirect('success')
        except Exception as e:
            return render(request, 'request_ride.html', {'error': str(e)})

    return render(request, 'request_ride.html')


def driver_panel(request):
    driver = Driver.objects.filter(is_verified=True).first()

    if not driver:
        return render(request, "driver_panel.html", {"error": "No verified driver available. Please add a driver in admin."})

    rides = Ride.objects.filter(
        driver=driver, status='accepted'
    ) | Ride.objects.filter(
        status='requested', driver__isnull=True
    )

    return render(request, 'driver_panel.html', {
        'driver': driver,
        'rides': rides.order_by('-created_at')
    })


def accept_ride(request, ride_id):
    if request.method == 'POST':
        driver = Driver.objects.filter(is_verified=True).first()
        if not driver:
            return redirect('driver_panel')

        ride = get_object_or_404(Ride, id=ride_id)

        if ride.status == 'requested' and ride.driver is None:
            ride.driver = driver
            ride.status = 'accepted'
            ride.save()

    return redirect('driver_panel')


def complete_ride(request, ride_id):
    ride = get_object_or_404(Ride, id=ride_id)

    if ride.status == 'accepted' or ride.status == 'ongoing':
        ride.status = 'completed'
        ride.save()

        if ride.driver:
            ride.driver.is_online = True
            ride.driver.save()

    return redirect('driver_panel')


def cancel_ride(request, ride_id):
    ride = get_object_or_404(Ride, id=ride_id)
    ride.status = 'cancelled'
    ride.save()
    return redirect('driver_panel')


def toggle_driver_status(request, driver_id):
    driver = get_object_or_404(Driver, id=driver_id)
    driver.is_online = not driver.is_online
    driver.save()
    return redirect('driver_panel')


def success(request):
    return render(request, "success.html")


def driver_login(request):
    if request.method == 'POST':
        mobile = request.POST.get('mobile')
        try:
            driver = Driver.objects.get(mobile=mobile)
            driver.is_online = True
            driver.save()
            return redirect('driver_panel')
        except Driver.DoesNotExist:
            return render(request, 'driver_login.html', {'error': 'Driver not found'})
    return render(request, 'driver_login.html')


def get_ride_status(request, ride_id):
    try:
        ride = Ride.objects.get(id=ride_id)
        return JsonResponse({
            'id': ride.id,
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
        return JsonResponse({'error': 'Ride not found'}, status=404)
