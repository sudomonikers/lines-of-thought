# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lines of Thought is a full-stack web application for visualizing and exploring complex ideas through branching thought paths, inspired by the concept of "lines" in chess analysis. Just as chess engines explore different lines of play, users can explore different lines of reasoning to develop and refine their thoughts.

The project consists of three main components:

1. **React UI** (`lines-of-thought-ui/`) - Frontend built with React, TypeScript, and Vite with a pixel art aesthetic
2. **API Backend** (`apis/`) - Express.js REST API with Neo4j graph database integration
3. **Infrastructure** (`infrastructure/`) - Terraform configuration for AWS deployment

## Architecture

### Frontend (lines-of-thought-ui/)
- React 19 with TypeScript
- Vite for build tooling and dev server
- ESLint for code quality
- Pixel art theme with animated HTML canvas background featuring a living city
- When making ui implementations, use the playwright mcp. Make sure to open on localhost:5173, since I use 5173

#### UI Features
- **Animated Background**: HTML Canvas with pixel art city, walking people, and philosophical thought bubbles
- **Thought Cards**: Display individual thoughts with navigation to parent and child thoughts
- **Search**: Full-text search across all thoughts
- **Branching**: Create multiple lines of reasoning from any thought
- **Parent Navigation**: View and navigate to preceding thoughts (shown on the left)
- **Branch Navigation**: View and navigate to child thoughts (shown on the right)
- **Help System**: Modal explaining the concept and usage of Lines of Thought

### Backend (apis/)
- Express.js server with TypeScript
- Dual deployment mode: local development and AWS Lambda (via serverless-http)
- Neo4j graph database for data storage with graph relationships
- Routes defined in `routes.ts`, handlers in `handlers/` directory
- Database connection managed in `lib/neo4j.ts` using singleton pattern
- CORS enabled for local development

#### API Endpoints
- **Nodes**: CRUD operations for thought nodes (`/nodes`)
- **Relationships**: Create and manage BRANCHES_TO relationships (`/relationships`)
- **Graph Queries**: Get node with children and parent (`/nodes/:id/graph`)
- **Search**: Full-text search across thought nodes (`/nodes/search`)

### Infrastructure (infrastructure/)
- Terraform manages all AWS resources
- UI hosted on S3 + CloudFront with custom domain (lines-of-thought.com)
- API deployed as Lambda function behind API Gateway + CloudFront (api.lines-of-thought.com)
- Route53 for DNS, ACM for SSL certificates
- General S3 bucket for file storage accessible by Lambda
- Environment variables for Neo4j connection injected into Lambda from `locals.tf`

## Key Implementation Details

### API Lambda Deployment
- The Lambda function expects `index.handler` as the entry point (exported from `apis/index.ts`)
- Uses `serverless-http` to wrap Express app for Lambda compatibility
- Environment variables (Neo4j credentials, JWT secret, S3 bucket) are set in `infrastructure/locals.tf` and injected by Terraform
- Lambda has IAM permissions for CloudWatch Logs and S3 access to the general bucket

### Neo4j Integration
- Connection singleton in `apis/lib/neo4j.ts` prevents multiple driver instances
- Sessions must be properly closed after queries to avoid resource leaks
- Graph structure: Thought nodes connected by BRANCHES_TO relationships
- The `getNodeWithChildren` handler returns both parent and child relationships for bidirectional navigation

#### Graph Data Model
- **Nodes**: Thought nodes with `text` and `createdAt` properties
- **Relationships**: BRANCHES_TO relationships representing thought chains
- Parent thoughts appear on the left in the UI
- Child branches appear on the right in the UI

### CloudFront + API Gateway
- API Gateway sits behind CloudFront for custom domain and caching
- CloudFront origin path is `/prod` (API Gateway stage name)
- Health endpoint (`/health`) has separate cache behavior with higher TTL
- API responses generally not cached (default_ttl = 0)