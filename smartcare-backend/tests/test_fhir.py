import unittest
from app.schemas.fhir import ObservationFHIR, Coding, EncryptedBlob


class TestFHIRSchema(unittest.TestCase):
    def test_observationfhir_minimal_valid(self):
        obs = ObservationFHIR(
            code=Coding(system='http://loinc.org', code='55284-4', display='BP'),
            subject={'reference': 'Patient/123'},
            valueEncrypted=EncryptedBlob(cipher_text='BASE64', version='v1')
        )
        self.assertEqual(obs.resourceType, 'Observation')
        self.assertEqual(obs.code.code, '55284-4')

    def test_encrypted_blob_fields(self):
        eb = EncryptedBlob(cipher_text='c', iv='i', salt='s', version='v1')
        self.assertEqual(eb.cipher_text, 'c')
        self.assertEqual(eb.version, 'v1')
