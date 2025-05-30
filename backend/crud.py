from sqlalchemy.orm import Session
from datetime import datetime
from models import QoSRuleHistory, SDNFlowRule 

def get_qos_rules(db: Session):
    return db.query(QoSRuleHistory).order_by(QoSRuleHistory.priority.desc()).all()

def create_qos_rule(db: Session, protocol: str, priority: int, bandwidth_bps: int = None):
    db_rule = QoSRuleHistory(
        protocol=protocol,
        last_applied=datetime.utcnow(),
        priority=priority,
        bandwidth_bps=bandwidth_bps
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

def update_qos_rule(db: Session, protocol: str, priority: int, bandwidth_bps: int = None):
    db_rule = db.query(QoSRuleHistory).filter_by(protocol=protocol).order_by(QoSRuleHistory.created_at.desc()).first()
    if db_rule:
        db_rule.priority = priority
        db_rule.bandwidth_bps = bandwidth_bps
        db_rule.last_applied = datetime.utcnow()
        db.commit()
        return db_rule
    return create_qos_rule(db, protocol, priority, bandwidth_bps)

def delete_qos_rule(db: Session, protocol: str):
    db_rule = db.query(QoSRuleHistory).filter_by(protocol=protocol).order_by(QoSRuleHistory.created_at.desc()).first()
    if db_rule:
        db.delete(db_rule)
        db.commit()
        return True
    return False





def get_sdn_rules(db: Session):
    return db.query(SDNFlowRule).order_by(SDNFlowRule.id.desc()).all()

def create_sdn_rule(db: Session, source_ip, destination_ip, action):
    db_rule = SDNFlowRule(
        source_ip=source_ip,
        destination_ip=destination_ip,
        action=action,
        priority=100,  # или любой другой дефолт
        status='ACTIVE',
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

def delete_sdn_rule(db: Session, rule_id: int):
    rule = db.query(SDNFlowRule).filter_by(id=rule_id).first()
    if rule:
        db.delete(rule)
        db.commit()
        return True
    return False
