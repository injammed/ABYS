#!/usr/bin/env python3
"""One inference request; no tools, delegation, repository writes or deployment."""
import json
import os
import sys
import urllib.request

BASE = 'https://ai-gateway.vercel.sh/v1'

def infer(request):
    agent = request['agent']
    if agent not in ('AETIMM', 'APY0C'):
        raise ValueError('Unknown identity')
    key = os.environ.get('AI_GATEWAY_API_KEY')
    model = os.environ.get(agent + '_MODEL') or os.environ.get('AI_GATEWAY_MODEL')
    if not key or not model:
        raise ValueError('Configure gateway key and explicit model ID')
    with urllib.request.urlopen(BASE + '/models', timeout=30) as response:
        models = json.load(response)
    if model not in {entry['id'] for entry in models['data']}:
        raise ValueError('Configured model is absent from current gateway catalog')
    payload = {'model': model, 'max_tokens': request['max_output_tokens'],
               'messages': [{'role': 'system', 'content': request['instruction'] +
                             '\nReturn only JSON matching output_contract. Evidence is unverified until independently checked.'},
                            {'role': 'user', 'content': json.dumps(request)}]}
    req = urllib.request.Request(BASE + '/chat/completions', data=json.dumps(payload).encode(),
                                 headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=240) as response:
        result = json.load(response)
    return json.loads(result['choices'][0]['message']['content'])

if __name__ == '__main__':
    try:
        print(json.dumps(infer(json.load(sys.stdin))))
    except Exception:
        # Never expose provider response bodies or credentials in worker logs.
        print('Inference failed; check configuration, provider availability and budget.', file=sys.stderr)
        sys.exit(1)
