# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.appointment import Appointment  # noqa
from app.models.invoice import Invoice  # noqa
from app.models.availability import Availability # noqa
from app.models.doctor_profile import DoctorProfile # noqa
from app.models.medical_record import MedicalRecord # noqa
from app.models.file import File # noqa
from app.models.notificatiion import Notification # noqa
from app.models.refresh_token import RefreshToken # noqa
from app.models.audit_log import AuditLog # noqa
