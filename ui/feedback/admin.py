from django.contrib import admin
from feedback.models import Feedback


# Register your models here.
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'cellphone_number', 'email', 'feedback_text', 'created_at')
    search_fields = ('name', 'cellphone_number', 'email', 'feedback_text')

admin.site.register(Feedback, FeedbackAdmin)
