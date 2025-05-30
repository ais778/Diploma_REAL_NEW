from sqlalchemy import Column, Integer, String, BigInteger, Numeric, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class QoSRuleHistory(Base):
    __tablename__ = "qos_rules_history"

    id = Column(Integer, primary_key=True, index=True)
    protocol = Column(String(16), nullable=False)
    last_applied = Column(TIMESTAMP, nullable=False)
    priority = Column(Integer, nullable=False)
    bandwidth_bps = Column(BigInteger, nullable=True)
    effectiveness = Column(Numeric(5, 2), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class SDNFlowRule(Base):
    __tablename__ = "sdn_flow_rules"
    id = Column(Integer, primary_key=True, index=True)
    source_ip = Column(String(45), nullable=False)
    destination_ip = Column(String(45), nullable=False)
    action = Column(String(16), nullable=False)
    priority = Column(Integer, default=100)
    status = Column(String(16), default='ACTIVE')
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)