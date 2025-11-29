pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = "docker-compose.yml"
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "Pulling latest code from GitHub..."
                checkout scm
                bat "git log -1"
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    echo "Building backend Docker image..."
                    bat """
                        cd backend
                        docker build -t capstone_backend:latest .
                    """
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    echo "Building frontend Docker image..."
                    bat """
                        cd frontend
                        docker build -t capstone_frontend:latest .
                    """
                }
            }
        }

        stage('Pre-Deploy Cleanup') {
            steps {
                script {
                    echo "Stopping and removing old containers..."
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% down -v || exit 0"
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                script {
                    echo "Deploying backend + frontend using Docker Compose..."
                    bat "docker-compose -f %DOCKER_COMPOSE_FILE% up -d --build --force-recreate"
                }
            }
        }

        stage('Integration Tests') {
            steps {
                script {
                    echo "Running backend tests (if any)..."

                    def status = bat(
                        script: "docker-compose -f %DOCKER_COMPOSE_FILE% exec backend pytest",
                        returnStatus: true
                    )

                    if (status == 5) {
                        echo "No tests were collected. Skipping..."
                    } else if (status != 0) {
                        error "Tests failed! Exit code: ${status}"
                    } else {
                        echo "Integration tests passed!"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully!"
            echo "Backend + Frontend microservice is now running."
        }
        failure {
            echo "Build failed. Check logs."
        }
    }
}
