from django import forms
from django.contrib.auth.models import User
from django.core.validators import RegexValidator


US_TEL_LEN = 10

tel_validator = RegexValidator(r'^\d{10}$', 'Invalid telephone number.')

# Create your forms here.
class CustomerRegisterForm(forms.Form):
    username = forms.CharField(max_length=15)
    password = forms.CharField(max_length=15, widget=forms.PasswordInput())
    confirm_password = forms.CharField(max_length=15, widget=forms.PasswordInput())
    email = forms.CharField(widget=forms.EmailInput())
    tel = forms.CharField(max_length=15, validators=[tel_validator])
    first_name = forms.CharField(max_length=30)
    last_name = forms.CharField(max_length=30)

    def clean(self):
        clean_data = super().clean()

        password = clean_data.get("password")
        password2 = clean_data.get("confirm_password")
        if password != password2:
            raise forms.ValidationError("Password don't match")

        return clean_data

    def clean_username(self):
        print("clean_username method called")
        username = self.cleaned_data.get("username")
        if ' ' in username:
            raise forms.ValidationError("Username cannot contain spaces.")
        if User.objects.filter(username__exact=username).exists():
            raise forms.ValidationError("Username already been occupied!")

        return username
