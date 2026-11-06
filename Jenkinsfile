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
      steps { sh 'npm ci' }
    }

    stage('Quality') {
      steps {
        sh 'npm run lint'
        sh 'npm test'
      }
    }

    stage('Build') {
      steps {
        sh 'docker build --label org.opencontainers.image.revision="$GIT_COMMIT" -t "$IMAGE_NAME:$SHORT_SHA" .'
      }
    }
  }

  post {
    success { echo 'Pipeline OK' }
    failure { echo 'Pipeline en échec' }
    cleanup { cleanWs() }
  }
}
