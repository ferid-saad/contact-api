pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    IMAGE_NAME = 'feridsaad/contact-api'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script { env.SHORT_SHA = env.GIT_COMMIT.take(7) }
        echo "Commit : ${env.SHORT_SHA}"
      }
    }

    stage('Install') {
      agent {
        docker {
          image 'node:24-alpine'
          reuseNode true
          args '-e HOME=/tmp'
        }
      }
      steps { sh 'npm ci' }
    }

    stage('Quality') {
      parallel {
        stage('Lint') {
          agent {
            docker {
              image 'node:24-alpine'
              reuseNode true
              args '-e HOME=/tmp'
            }
          }
          steps { sh 'npm run lint' }
        }
        stage('Unit tests') {
          agent {
            docker {
              image 'node:24-alpine'
              reuseNode true
              args '-e HOME=/tmp'
            }
          }
          steps { sh 'npm run test:ci' }
        }
      }
    }

    stage('Build') {
      steps {
        sh 'docker build --label org.opencontainers.image.revision="$GIT_COMMIT" -t "$IMAGE_NAME:$SHORT_SHA" .'
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'reports/junit.xml'
    }
    success { echo 'Pipeline OK' }
    failure { echo 'Pipeline en échec' }
    cleanup { cleanWs() }
  }
}
