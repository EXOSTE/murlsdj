from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+pg8000://postgres:motdepasse@localhost:5432/mur_lsdj"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()

# Normalize database URL to use the pg8000 driver
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
elif settings.DATABASE_URL.startswith("postgresql://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

# Remove sslmode query parameter as it causes a crash with the pg8000 driver connect() method
if "postgresql+pg8000" in settings.DATABASE_URL:
    import urllib.parse
    parsed = urllib.parse.urlparse(settings.DATABASE_URL)
    query_params = urllib.parse.parse_qs(parsed.query)
    query_params.pop("sslmode", None)  # Remove sslmode query param
    new_query = urllib.parse.urlencode(query_params, doseq=True)
    parsed = parsed._replace(query=new_query)
    settings.DATABASE_URL = urllib.parse.urlunparse(parsed)


