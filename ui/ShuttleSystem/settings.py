from pathlib import Path
from datetime import timedelta
import environ

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()
env.read_env(BASE_DIR / ".env")

# Core

DEBUG = env("DEBUG", cast=bool, default=True)
env.read_env(BASE_DIR / ".env.dev" if DEBUG else ".env.prod", overwrite=True)
if DEBUG:
    SECRET_KEY = env("SECRET_KEY", default="")
    CRYPTO_KEY = env("CRYPTO_KEY", default="")
else:
    SECRET_KEY = env("SECRET_KEY")
    ALLOWED_HOSTS = ["ramp-pilot.com"]
    CRYPTO_KEY = env("CRYPTO_KEY")

LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/New_York"
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Logging

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "format": "{asctime} {levelname} - {message}",
            "style": "{",
        },
        "verbose": {
            "format": (
                "{asctime} [P{process}/T{thread}] "
                "{name}.{levelname} - {message}"
            ),
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "DEBUG" if DEBUG else "WARN",
            "formatter": "verbose" if DEBUG else "simple",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": env("LOG_FILENAME", default="ramp-backend.log"),
            "maxBytes": 1e6,
            "backupCount": 100,
            "formatter": "verbose",
        },
    },
    "loggers": {
        "root": {
            "handlers": ["console"] if DEBUG else ["console", "file"],
            "level": "DEBUG" if DEBUG else "INFO",
        }
    },
}

# Services

# Email
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
RECIPIENT_ADDRESS = env("RECIPIENT_ADDRESS")

# Text message
ACCOUNT_SID = env("ACCOUNT_SID")
AUTH_TOKEN = env("AUTH_TOKEN")
PHONE_NUMBER = env("PHONE_NUMBER")

# Google Cloud API key
GOOGLE_API_KEY = env("GOOGLE_CLOUD_API_KEY")


# Application

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "django_extensions",
    "rest_framework",
    "rest_framework_simplejwt",
    "django_apscheduler",
    "account",
    "payment",
    "reservation.apps.ReservationConfig",
    "shuttle",
    "bus",
    "dialin",
    "feedback",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "jwt_handler.middleware.JWTMiddleware"
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

ROOT_URLCONF = "ShuttleSystem.urls"
WSGI_APPLICATION = "ShuttleSystem.wsgi.application"
STATIC_URL = "/static/"
STATIC_ROOT = env("STATIC_ROOT", default="static")

DATABASES = {
    "default": {
        "ENGINE": env("DATABASE_ENGINE", default="django.db.backends.sqlite3"),
        "NAME": env("DATABASE_NAME", default=str(BASE_DIR / "db.sqlite3")),
        "HOST": env("DATABASE_HOST", default=""),
        "PORT": env("DATABASE_PORT", default=""),
        "USER": env("DATABASE_USER", default=""),
        "PASSWORD": env("DATABASE_PASSWORD", default=""),
    }
}
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation"
            ".UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation.MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation"
            ".CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation"
            ".NumericPasswordValidator"
        ),
    },
]

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('JWT',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    "TOKEN_OBTAIN_SERIALIZER": "ShuttleSystem.serializers.MyTokenObtainPairSerializer"
}

if DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [
        # NOTE: Here we do not use '\d' because that will match unicode numbers
        # as well.
        r"^http://localhost:[0-9]+$",
        r"^http://127\.0\.0\.1:[0-9]+$",
    ]
else:
    CORS_ALLOWED_ORIGINS = ["https://ramp-pilot.com"]

# Max number of workers used by the scheduler
EXECUTOR_MAX_WORKERS = 3

# Dev

if DEBUG:
    INSTALLED_APPS.append("debug_toolbar")
    MIDDLEWARE.append("debug_toolbar.middleware.DebugToolbarMiddleware")
    INTERNAL_IPS = ["127.0.0.1"]
