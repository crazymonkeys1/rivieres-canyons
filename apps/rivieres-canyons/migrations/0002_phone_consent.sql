-- Proof of consent for the optional phone number (lead form step 2).
ALTER TABLE leads ADD COLUMN phone_consent_text TEXT;
ALTER TABLE leads ADD COLUMN phone_consent_text_version TEXT;
