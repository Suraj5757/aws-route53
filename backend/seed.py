from app.database import Base, engine, SessionLocal
from app.models import HostedZone, DNSRecord

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if not db.query(HostedZone).first():
    zone = HostedZone(
        name="example.com",
        type="Public",
        comment="Demo hosted zone",
        private_zone=False,
    )
    db.add(zone)
    db.flush()

    db.add_all([
        DNSRecord(hosted_zone_id=zone.id, name="example.com", type="A", ttl=300, value="192.0.2.10"),
        DNSRecord(hosted_zone_id=zone.id, name="www.example.com", type="CNAME", ttl=300, value="example.com"),
        DNSRecord(hosted_zone_id=zone.id, name="example.com", type="TXT", ttl=300, value='"route53-clone-demo"'),
        DNSRecord(hosted_zone_id=zone.id, name="example.com", type="MX", ttl=3600, value="10 mail.example.com"),
    ])
    db.commit()
    print("Seeded demo data.")
else:
    print("Database already contains data.")

db.close()
