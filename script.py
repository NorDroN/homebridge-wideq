import wideq
import argparse
import time
import json


def get_values(device, model, mon):
    data = mon.poll()
    if data:
        values = model.decode_monitor(data)
        res = {}
        res['id'] = device.id
        res['name'] = device.name
        res['model'] = device.model_id
        res['type'] = device.type.name
        res['version'] = model.data['Info']['version']
        currentValues = {}
        for key, value in values.items():
            desc = model.value(key)
            currentValues[key] = value
            if isinstance(desc, wideq.EnumValue):
                currentValues[key] = desc.options.get(value, value)
            elif isinstance(desc, wideq.RangeValue):
                currentValues[key+'Min'] = desc.min
                currentValues[key+'Max'] = desc.max
        res['state'] = currentValues
        print(json.dumps(res))


def init_mon(client):
    arr = []
    for device in client.devices:
        res = {}
        res['device'] = device
        res['model'] = client.model_info(device)
        res['mon'] = wideq.Monitor(client.session, device.id)
        arr.append(res)
    return arr


def start_mon(devices, interval):
    for device in devices:
        device['mon'].start()

    while True:
        for device in devices:
            get_values(device['device'], device['model'], device['mon'])
        time.sleep(interval)


def example(token, country, language, interval):
    client = wideq.Client.from_token(token, country, language)

    try:
        devices = init_mon(client)
        start_mon(devices, interval)
    except wideq.NotLoggedInError:
        client.refresh()


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--token', '-t',
        help='refresh token'
    )
    parser.add_argument(
        '--interval', '-i',
        type=int,
        help='interval (seconds)'
    )
    parser.add_argument(
        '--country', '-c',
        help='country code for account (default: {})'
        .format(wideq.DEFAULT_COUNTRY)
    )
    parser.add_argument(
        '--language', '-l',
        help='language code for the API (default: {})'
        .format(wideq.DEFAULT_LANGUAGE)
    )

    args = parser.parse_args()
    example(args.token, args.country, args.language, args.interval)


if __name__ == '__main__':
    main()

