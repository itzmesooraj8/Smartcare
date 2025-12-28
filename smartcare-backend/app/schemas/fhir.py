from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal


class Reference(BaseModel):
    reference: str
    display: Optional[str]


class CodeableConcept(BaseModel):
    coding: Optional[list[Dict[str, Any]]] = None
    text: Optional[str] = None


class ObservationResource(BaseModel):
    resourceType: Literal['Observation'] = Field('Observation', const=True)
    status: str
    code: CodeableConcept
    subject: Reference
    effectiveDateTime: Optional[str] = None
    valueString: Optional[str] = None
    # Additional extension or meta if needed
    meta: Optional[Dict[str, Any]] = None
"""
FHIR adapter schemas.

This module defines a Pydantic model for a FHIR Observation that wraps encrypted
blobs. The model includes a minimal set of required FHIR fields and supports
common telehealth LOINC codes for vital observations. The clinical payload is
kept as an encrypted blob so PHI remains end-to-end encrypted.
"""
from pydantic import BaseModel, Field
from typing import Optional, Any, List


class EncryptedBlob(BaseModel):
    cipher_text: str
    iv: Optional[str] = None
    salt: Optional[str] = None
    version: str = 'v1'


class Coding(BaseModel):
    system: str
    code: str
    display: Optional[str]


class ObservationFHIR(BaseModel):
    resourceType: str = Field('Observation', const=True)
    id: Optional[str]
    status: str = Field('final')
    category: Optional[List[Coding]] = None
    code: Coding
    subject: dict  # minimal reference to patient { 'reference': 'Patient/{id}' }
    effectiveDateTime: Optional[str] = None
    valueEncrypted: EncryptedBlob
    note: Optional[str] = None

    class Config:
        schema_extra = {
            'example': {
                'resourceType': 'Observation',
                'code': {'system': 'http://loinc.org', 'code': '55284-4', 'display': 'Blood pressure systolic & diastolic'},
                'subject': {'reference': 'Patient/1234'},
                'valueEncrypted': {'cipher_text': 'BASE64...', 'iv': 'BASE64...', 'version': 'v1'}
            }
        }
