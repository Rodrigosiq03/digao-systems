delete from audit_logs
where target_type = 'user_vpn_access'
  and action = 'user_vpn_access.provider_synced';
