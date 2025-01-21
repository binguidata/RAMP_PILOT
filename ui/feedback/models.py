from django.db import models


# Create your models here.
class Feedback(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    cellphone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    feedback_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
