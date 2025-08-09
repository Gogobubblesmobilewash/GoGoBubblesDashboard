#!/bin/bash

# Complete Database Schema Deployment Script for GoGoBubbles Bubbler Dashboard
# This script applies the complete schema including tables, RPC functions, and RLS policies

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCHEMA_FILE="complete_schema.sql"
LOG_FILE="deployment_$(date +%Y%m%d_%H%M%S).log"

echo -e "${BLUE}🚀 GoGoBubbles Bubbler Dashboard - Database Schema Deployment${NC}"
echo "================================================================"
echo ""

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Error: Schema file '$SCHEMA_FILE' not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Schema file found: $SCHEMA_FILE${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql command not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL client tools found${NC}"
echo ""

# Prompt for database connection details
echo -e "${YELLOW}🔐 Database Connection Details${NC}"
echo "----------------------------------------"

read -p "Database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Database name: " DB_NAME
if [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ Error: Database name is required${NC}"
    exit 1
fi

read -p "Database user: " DB_USER
if [ -z "$DB_USER" ]; then
    echo -e "${RED}❌ Error: Database user is required${NC}"
    exit 1
fi

read -s -p "Database password: " DB_PASSWORD
echo ""

echo ""

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to database. Please check your credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database connection successful${NC}"
echo ""

# Check if required extensions exist
echo -e "${YELLOW}🔍 Checking required database extensions...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    extname,
    CASE 
        WHEN extname IN ('uuid-ossp', 'pgcrypto') THEN '✅ Required'
        ELSE '⚠️  Optional'
    END as status
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;
" 2>/dev/null || echo -e "${YELLOW}⚠️  Some extensions may not be available${NC}"

echo ""

# Create backup before deployment
echo -e "${YELLOW}💾 Creating database backup...${NC}"
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Could not create backup (this may be normal for some database setups)${NC}"
fi

echo ""

# Confirm deployment
echo -e "${YELLOW}⚠️  WARNING: This will modify your database schema!${NC}"
echo "The following will be created/modified:"
echo "  • Tables: jobs, job_assignments, equipment, equipment_requests, messages, ratings, bubbler_feedback, lead_bubbler_review"
echo "  • RPC Functions: current_bubbler_id(), get_my_earnings_breakdown(), get_bubbler_feedback_for_current_lead()"
echo "  • RLS Policies: Comprehensive security policies for all tables"
echo "  • Indexes: Performance optimization indexes"
echo "  • Triggers: Automatic timestamp updates"
echo ""

read -p "Do you want to proceed with the deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}🚫 Deployment cancelled by user${NC}"
    exit 0
fi

echo ""

# Deploy schema
echo -e "${YELLOW}🚀 Deploying database schema...${NC}"
echo "This may take a few minutes..."

# Log all output
exec > >(tee -a "$LOG_FILE") 2>&1

START_TIME=$(date +%s)

if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo -e "${GREEN}✅ Schema deployment completed successfully!${NC}"
    echo "⏱️  Duration: ${DURATION} seconds"
    echo ""
    
    # Verify deployment
    echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
    
    # Check tables
    echo "📊 Checking tables..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        schemaname,
        tablename,
        CASE 
            WHEN schemaname = 'public' THEN '✅ Public Table'
            ELSE '⚠️  Other Schema'
        END as status
    FROM pg_tables 
    WHERE tablename IN ('jobs', 'job_assignments', 'equipment', 'equipment_requests', 'messages', 'ratings', 'bubbler_feedback', 'lead_bubbler_review')
    ORDER BY tablename;
    "
    
    # Check RPC functions
    echo ""
    echo "🔧 Checking RPC functions..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        proname as function_name,
        CASE 
            WHEN proname IN ('current_bubbler_id', 'get_my_earnings_breakdown', 'get_bubbler_feedback_for_current_lead') THEN '✅ Required Function'
            ELSE '⚠️  Other Function'
        END as status
    FROM pg_proc 
    WHERE proname IN ('current_bubbler_id', 'get_my_earnings_breakdown', 'get_bubbler_feedback_for_current_lead')
    ORDER BY proname;
    "
    
    # Check RLS policies
    echo ""
    echo "🔒 Checking RLS policies..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        schemaname,
        tablename,
        policyname,
        CASE 
            WHEN rowsecurity = true THEN '✅ RLS Enabled'
            ELSE '❌ RLS Disabled'
        END as rls_status
    FROM pg_tables 
    WHERE tablename IN ('jobs', 'job_assignments', 'equipment', 'equipment_requests', 'messages', 'ratings', 'bubbler_feedback', 'lead_bubbler_review')
    ORDER BY tablename;
    "
    
    echo ""
    echo -e "${GREEN}🎉 Deployment verification completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Set up environment variables in your deployment platform"
    echo "2. Test the dashboard with a test user account"
    echo "3. Verify RLS policies are working correctly"
    echo "4. Check that all tabs load without errors"
    echo "5. Test Accept/Decline job actions"
    echo "6. Verify equipment requests functionality"
    echo "7. Test messaging system"
    echo "8. Check ratings and earnings display"
    echo ""
    echo -e "${BLUE}📁 Files created:${NC}"
    echo "  • Schema: $SCHEMA_FILE"
    echo "  • Backup: $BACKUP_FILE"
    echo "  • Log: $LOG_FILE"
    
else
    echo ""
    echo -e "${RED}❌ Schema deployment failed!${NC}"
    echo "Check the log file for details: $LOG_FILE"
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo "1. Check database permissions"
    echo "2. Verify database user has CREATE, ALTER, and GRANT privileges"
    echo "3. Check if required extensions are available"
    echo "4. Review the log file for specific error messages"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Deployment script completed!${NC}"
