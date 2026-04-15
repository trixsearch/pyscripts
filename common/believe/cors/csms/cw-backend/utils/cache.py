from django.core.cache import caches

cache = caches['redis']

# uncomment below if want to use default fileSystem cache instead of redis
# cache = caches['default']

def set_cache(key, data):
    return cache.set(key, data)

def delete_cache(key):
    return cache.delete(key)

def get_cache(key):
    return cache.get(key)
