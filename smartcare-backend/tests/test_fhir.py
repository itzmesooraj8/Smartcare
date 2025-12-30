from app.schemas.fhir import ObservationFHIR, Coding, EncryptedBlob


def test_observationfhir_minimal_valid():
    obs = ObservationFHIR(
        code=Coding(system='http://loinc.org', code='55284-4', display='BP'),
        subject={'reference': 'Patient/123'},
        valueEncrypted=EncryptedBlob(cipher_text='BASE64', version='v1')
    )
    assert obs.resourceType == 'Observation'
    assert obs.code.code == '55284-4'


def test_encrypted_blob_fields():
    eb = EncryptedBlob(cipher_text='c', iv='i', salt='s', version='v1')
    assert eb.cipher_text == 'c'
    assert eb.version == 'v1'
