# -*- coding: utf-8 -*-

from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import String

from fevermap.db.base import Base

from dataclasses import dataclass


@dataclass
class Submission(Base):
    """Single datapoint submitted."""

    __tablename__ = 'submissions'

    fever_status = Column(Boolean)
    fever_temp = Column(Float(precision=1))
    symptom_chest_tightness = Column(Boolean)
    symptom_chills = Column(Boolean)
    symptom_disorientation = Column(Boolean)
    symptom_dizziness = Column(Boolean)
    symptom_diarrhoea = Column(Boolean)
    symptom_dry_cough = Column(Boolean)
    symptom_fatigue = Column(Boolean)
    symptom_loss_of_smell = Column(Boolean)
    symptom_loss_of_taste = Column(Boolean)
    symptom_nasal_congestion = Column(Boolean)
    symptom_nausea_vomiting = Column(Boolean)
    symptom_muscle_joint_pain = Column(Boolean)
    symptom_sputum_production = Column(Boolean)
    symptom_shortness_breath = Column(Boolean)
    symptom_sore_throat = Column(Boolean)
    symptom_headache = Column(Boolean)
    diagnosed_covid19 = Column(String(20))

    location_county_code = Column(String(5))
    location_town_name = Column(String(40))

    # Convert to Column(Point) when a custom field type that matches the
    # MariaDB geospatial data type is written
    # See https://docs.sqlalchemy.org/en/13/core/types.html

    submitter_id = Column(Integer, ForeignKey('submitters.id'))

    def __repr__(self):
        return '<Submission(id={})>'.format(self.id)
