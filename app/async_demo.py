from rich import print
import time
import asyncio

async def endpoint(route:str)->str:
    print(f">>handling{route}")
    #emulate database delay
    await asyncio.sleep(1)
    print(f"<< response{route}")
    return route

async def server():
    tests=(
        "GET /shipment?id=1",
        "PATCH /shipment?id=2",
        "GET /shipment?id=4",
    )
    start=time.perf_counter()
    async with asyncio.TaskGroup() as task_group:
        tasks=[
            task_group.create_task(endpoint(route))
        for route in tests
        ]
        print(tasks[0])
    end=time.perf_counter()
    print(f"Time taken:{end-start:.2f}s")
    
asyncio.run(server())