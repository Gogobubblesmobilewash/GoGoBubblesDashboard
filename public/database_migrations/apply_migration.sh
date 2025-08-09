#!/bin/bash

# GoGoBubbles Database Migration Script
# This script helps apply the Lead/Bubbler feedback tables migration

echo "🚀 GoGoBubbles Database Migration"
echo "=================================="
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql (PostgreSQL client) is not installed or not in PATH"
    echo "Please install PostgreSQL client tools first."
    echo ""
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "On Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check if migration file exists
MIGRATION_FILE="lead_bubbler_feedback_tables.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file '$MIGRATION_FILE' not found"
    echo "Please run this script from the database_migrations directory"
    exit 1
fi

echo "📋 Migration file found: $MIGRATION_FILE"
echo ""

# Prompt for database connection details
echo "Please provide your Supabase database connection details:"
echo ""

read -p "Database Host (e.g., db.hombfzdgmtbbaahglclv.supabase.co): " DB_HOST
read -p "Database Name (e.g., postgres): " DB_NAME
read -p "Database Port (e.g., 5432): " DB_PORT
read -p "Database User (e.g., postgres): " DB_USER
read -s -p "Database Password: " DB_PASSWORD
echo ""

echo ""
echo "🔗 Connecting to database..."

# Test connection
if psql "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD" -c "SELECT version();" &> /dev/null; then
    echo "✅ Database connection successful!"
    echo ""
    
    # Ask for confirmation
    echo "⚠️  WARNING: This will modify your database structure!"
    echo "Tables to be created:"
    echo "  - bubbler_feedback"
    echo "  - lead_bubbler_review"
    echo ""
    echo "Functions to be created:"
    echo "  - get_bubbler_feedback_for_current_lead()"
    echo "  - get_my_earnings_breakdown()"
    echo ""
    
    read -p "Do you want to proceed? (y/N): " CONFIRM
    
    if [[ $CONFIRM =~ ^[Yy]$ ]]; then
        echo ""
        echo "🔄 Applying migration..."
        
        # Apply the migration
        if psql "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD" -f "$MIGRATION_FILE"; then
            echo ""
            echo "✅ Migration applied successfully!"
            echo ""
            echo "🎉 Your GoGoBubbles dashboard now has:"
            echo "   • Lead/Bubbler feedback system"
            echo "   • Anonymous feedback submission"
            echo "   • Lead performance reviews"
            echo "   • Enhanced earnings tracking"
            echo ""
            echo "📚 Check the README.md file for usage examples and next steps."
        else
            echo ""
            echo "❌ Error applying migration. Please check the error messages above."
            echo "You may need to run the migration manually or check your database permissions."
        fi
    else
        echo ""
        echo "❌ Migration cancelled."
    fi
else
    echo "❌ Error: Could not connect to database"
    echo "Please check your connection details and try again."
    echo ""
    echo "Common issues:"
    echo "  - Incorrect host, port, or credentials"
    echo "  - Database not accessible from your network"
    echo "  - Firewall blocking connection"
fi

echo ""
echo "🏁 Migration script completed."
