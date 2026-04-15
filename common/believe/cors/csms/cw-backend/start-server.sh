#cd code
echo "Running make migration"
python manage.py makemigrations
echo "Running schema migration"
python manage.py migrate
echo "Creating license"
python manage.py create_license
# echo "Creating base Org"
# python manage.py create_base_org
echo "Creating SUPER USER"
python manage.py create_ezedox_admin