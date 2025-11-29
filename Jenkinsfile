pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                echo "Pulling latest code from GitHub..."
                checkout scm
            }
        }

        /* ============================================
           APPLICATION 1: capstone2.0_app
           ============================================ */

        stage('Build App 1 Docker Image') {
            steps {
                echo "Building Docker image for capstone2.0_app..."
                sh """
                    cd capstone2.0_app
                    docker build -t capstone20/app1:latest .
                """
            }
        }

        stage('Run App 1 with Docker Compose') {
            steps {
                echo "Starting capstone2.0_app using docker-compose..."
                sh """
                    cd capstone2.0_app
                    docker compose down || true
                    docker compose up -d --build
                """
            }
        }

        /* ============================================
           APPLICATION 2: capstone2.0_appapp
           ============================================ */

        stage('Build App 2 Docker Images') {
            steps {
                echo "Building Docker images for capstone2.0_appapp..."
                sh """
                    cd capstone2.0_appapp
                    docker compose build
                """
            }
        }

        stage('Run App 2 with Docker Compose') {
            steps {
                echo "Starting capstone2.0_appapp using docker-compose..."
                sh """
                    cd capstone2.0_appapp
                    docker compose down || true
                    docker compose up -d --build
                """
            }
        }

    }

    post {
        success {
            echo "Both applications deployed successfully!"
        }
        failure {
            echo "Build or deployment failed. Check logs."
        }
    }
}
