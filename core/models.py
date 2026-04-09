from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Customer(models.Model):
    name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True, null=True)
    otp = models.CharField(max_length=6, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    total_rides = models.PositiveIntegerField(default=0)
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    auth_token = models.CharField(max_length=64, blank=True, null=True, unique=True)

    def __str__(self):
        return self.name


class Passenger(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    mobile = models.CharField(max_length=10, default="0000000000")
    email = models.EmailField(blank=True, null=True)
    username = models.CharField(max_length=50, default="Anonymous")

    def __str__(self):
        return self.username if self.username else f"Passenger {self.id}"


class Driver(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100, blank=True)
    mobile = models.CharField(max_length=15, unique=True)
    vehicle_type = models.CharField(max_length=50, default="Mini", choices=[
        ('mini', 'Mini'),
        ('sedan', 'Sedan'),
        ('suv', 'SUV'),
        ('auto', 'Auto'),
        ('bike', 'Bike'),
    ])
    
    pan = models.FileField(upload_to='documents/', null=True, blank=True)
    aadhaar = models.FileField(upload_to='documents/', null=True, blank=True)
    rc = models.FileField(upload_to='documents/', null=True, blank=True)
    number_plate = models.FileField(upload_to='documents/', null=True, blank=True)

    license_doc = models.FileField(upload_to='docs/', null=True, blank=True)
    id_doc = models.FileField(upload_to='docs/', null=True, blank=True)
    vehicle_doc = models.FileField(upload_to='docs/', null=True, blank=True)

    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)

    docs_submitted = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)

    def __str__(self):
        return self.name if self.name else f"Driver {self.id}"


class Ride(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('accepted', 'Accepted'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, null=True, blank=True)
    passenger = models.ForeignKey('Passenger', on_delete=models.CASCADE, null=True, blank=True)
    driver = models.ForeignKey('Driver', on_delete=models.SET_NULL, null=True, blank=True)

    pickup_location = models.CharField(max_length=200, default="Unknown")
    drop_location = models.CharField(max_length=200, default="Unknown")
    vehicle_type = models.CharField(max_length=50, default="Mini")

    pickup_lat = models.FloatField(null=True, blank=True)
    pickup_lng = models.FloatField(null=True, blank=True)
    drop_lat = models.FloatField(null=True, blank=True)
    drop_lng = models.FloatField(null=True, blank=True)

    distance_km = models.FloatField(default=0, null=True, blank=True)
    fare = models.FloatField(null=True, blank=True)
    price = models.FloatField(null=True, blank=True)
    otp = models.CharField(max_length=6, blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ride {self.id} ({self.status})"


class RideLocation(models.Model):
    ride = models.OneToOneField('Ride', on_delete=models.CASCADE, related_name='location')
    pickup_lat = models.FloatField(null=True, blank=True)
    pickup_lon = models.FloatField(null=True, blank=True)
    drop_lat = models.FloatField(null=True, blank=True)
    drop_lon = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"RideLocation for Ride {self.ride.id}"


class Feedback(models.Model):
    ride = models.OneToOneField('Ride', on_delete=models.CASCADE)
    rating = models.IntegerField(default=0)
    comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Feedback for Ride {self.ride.id} - {self.rating}⭐"


class SupportTicket(models.Model):
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, null=True, blank=True)
    driver = models.ForeignKey('Driver', on_delete=models.CASCADE, null=True, blank=True)

    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, default='open')

    def __str__(self):
        return f"Ticket {self.id} - {self.subject}"
