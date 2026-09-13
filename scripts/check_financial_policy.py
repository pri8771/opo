"""Read-only financial invariants. Never import or execute candidate application code."""
import json, pathlib, re, sys
EXPECTED = {"BTC": ("Bitcoin mainnet", "1D2f3WGvSKpLvJrz7KGRzr1M1b5TpqLneA"), "BCH": ("Bitcoin Cash mainnet", "qzplrt49uvte6e9m6sv5d4rgwphz03j7fyarcprjs4"), "ETH": ("Ethereum mainnet, native ETH only", "0x6e75D53E9Ef2d10563f807C06c45d74c381bcaA0")}
def validate(root):
    root=pathlib.Path(root); errors=[]
    try:
        value=json.loads((root/'public/challenge.json').read_text())
        rows=value['chains']
        actual={r['symbol']:(r['network'],r['address']) for r in rows}
        if len(rows)!=3 or actual!=EXPECTED: errors.append('Donation destinations or networks differ from owner-approved values')
        if value['budget']['new_cash_investment_usd']!=0: errors.append('New-cash budget changed')
    except (ValueError,KeyError,OSError,TypeError): errors.append('Canonical challenge is missing or malformed')
    approved={v[1] for v in EXPECTED.values()}
    patterns=[r'\b0x[a-fA-F0-9]{40}\b',r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b',r'\b(?:bitcoincash:)?[qp][023456789acdefghjklmnpqrstuvwxyz]{41}\b',r'\bbc1[ac-hj-np-z02-9]{11,71}\b']
    for folder in ['app','lib','public','operator']:
        for path in (root/folder).rglob('*'):
            if not path.is_file() or path.suffix.lower() not in {'.ts','.tsx','.js','.json','.txt','.md','.py','.html','.svg'}: continue
            text=path.read_text(encoding='utf-8')
            for pattern in patterns:
                for candidate in re.findall(pattern,text):
                    if candidate.removeprefix('bitcoincash:') not in approved: errors.append('Unapproved wallet-like destination in '+str(path.relative_to(root)))
    return sorted(set(errors))
if __name__=='__main__':
    errors=validate(sys.argv[1] if len(sys.argv)>1 else '.')
    print(json.dumps({'financial_policy':'fail' if errors else 'pass','errors':errors}))
    sys.exit(1 if errors else 0)
