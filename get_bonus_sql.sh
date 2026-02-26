#!/bin/bash
ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)
curl -s -X POST "https://hlwyscthkuohbrksklnn.supabase.co/rest/v1/rpc/get_project_kpis" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
