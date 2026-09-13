import importlib.util, json, pathlib, tempfile, unittest
spec=importlib.util.spec_from_file_location('policy',pathlib.Path(__file__).with_name('check_financial_policy.py')); policy=importlib.util.module_from_spec(spec);spec.loader.exec_module(policy)
class RedirectTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=pathlib.Path(self.tmp.name);(self.root/'public').mkdir();(self.root/'app').mkdir()
        self.data={'chains':[{'symbol':k,'network':v[0],'address':v[1]} for k,v in policy.EXPECTED.items()],'budget':{'new_cash_investment_usd':0}};self.save()
    def tearDown(self): self.tmp.cleanup()
    def save(self): (self.root/'public/challenge.json').write_text(json.dumps(self.data))
    def test_approved(self): self.assertEqual(policy.validate(self.root),[])
    def test_address_substitution(self):
        self.data['chains'][0]['address']='1BoatSLRHtKNngkdXEeobR76b53LETtpyT';self.save();self.assertTrue(policy.validate(self.root))
    def test_network_substitution(self):
        self.data['chains'][2]['network']='Other chain';self.save();self.assertTrue(policy.validate(self.root))
    def test_alternate_address_in_page(self):
        (self.root/'app/route.ts').write_text('pay 0x1111111111111111111111111111111111111111');self.assertTrue(policy.validate(self.root))
    def test_missing_configuration(self):
        (self.root/'public/challenge.json').unlink();self.assertTrue(policy.validate(self.root))
    def test_budget_increase(self):
        self.data['budget']['new_cash_investment_usd']=1;self.save();self.assertTrue(policy.validate(self.root))
    def test_root_contribution_documents_reject_alternate_wallet(self):
        for name in ['README.md','RULES.md','AGENTS.md','CONTRIBUTING.md']:
            with self.subTest(name=name):
                path=self.root/name;path.write_text('Donate: 0x1111111111111111111111111111111111111111')
                self.assertIn('Unapproved wallet-like destination in '+name,policy.validate(self.root))
                path.unlink()
    def test_nested_contribution_documents_reject_alternate_wallet(self):
        for name in ['docs/contributing/payment.md','claim-cards/README.md']:
            with self.subTest(name=name):
                path=self.root/name;path.parent.mkdir(parents=True,exist_ok=True)
                path.write_text('Donate: 0x1111111111111111111111111111111111111111')
                self.assertIn('Unapproved wallet-like destination in '+name,policy.validate(self.root))
                path.unlink()
    def test_explicit_test_fixture_directories_are_excluded(self):
        for name in ['tests/payment.md','operator/tests/payment.md','docs/fixtures/payment.md','claim-cards/test-fixtures/payment.md']:
            path=self.root/name;path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text('Deliberately invalid: 0x1111111111111111111111111111111111111111')
        self.assertEqual(policy.validate(self.root),[])
if __name__=='__main__': unittest.main()
