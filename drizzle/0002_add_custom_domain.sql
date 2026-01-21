ALTER TABLE biolinks
ADD COLUMN custom_domain VARCHAR(255) UNIQUE,
ADD COLUMN domain_verification_token VARCHAR(64),
ADD COLUMN domain_ownership_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN cname_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_biolinks_custom_domain ON biolinks(custom_domain) WHERE custom_domain IS NOT NULL;

CREATE INDEX idx_biolinks_verified_domains ON biolinks(custom_domain)
WHERE domain_ownership_verified = TRUE AND cname_verified = TRUE;
