pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = "docker-compose.yml"
        FRONTEND_IMAGE = "capstone20/frontend"
        BACKEND_IMAGE = "capstone20/backend"
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "Pulling latest code..."
                checkout scm
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo "Building frontend Docker image..."
                sh """
                    docker build -t ${FRONTEND_IMAGE}:latest ./frontend
                """
            }
        }

        stage('Build Backend Image') {
            steps {
                echo "Building backend Docker image..."
                sh """
                    docker build -t ${BACKEND_IMAGE}:latest ./backend
                """
            }
        }

        stage('Docker Compose Up') {
            steps {
                echo "Running docker compose..."
                sh """
                    docker compose down || true
                    docker compose up -d --build
                """
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully!"
        }
        failure {
            echo "Build failed. Check the logs!"
        }
    }
}
