import os
from django.http import JsonResponse

def health_check(request):
    try:
        # CPU: get 1-minute load average
        load1, load5, load15 = os.getloadavg()
        cpu_count = os.cpu_count() or 1
        cpu_usage_percent = (load1 / cpu_count) * 100

        # Memory: check total and available memory using /proc/meminfo (Linux only)
        meminfo = {}
        with open('/proc/meminfo') as f:
            for line in f:
                key, value = line.split(':')
                meminfo[key] = int(value.strip().split()[0])

        total_mem = meminfo['MemTotal']
        free_mem = meminfo['MemAvailable']
        mem_usage_percent = ((total_mem - free_mem) / total_mem) * 100

        if cpu_usage_percent > 75 or mem_usage_percent > 75:
            return JsonResponse({
                "status": "NOT OK",
                "cpu_usage_percent": round(cpu_usage_percent, 2),
                "memory_usage_percent": round(mem_usage_percent, 2),
            }, status=503)

        return JsonResponse({
            "status": "OK",
            "cpu_usage_percent": round(cpu_usage_percent, 2),
            "memory_usage_percent": round(mem_usage_percent, 2),
        })

    except Exception as e:
        return JsonResponse({"status": "ERROR", "error": str(e)}, status=500)
