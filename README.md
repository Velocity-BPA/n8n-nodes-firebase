# n8n-nodes-firebase

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Firebase, Google's app development platform. This node enables workflow automation for Realtime Database, Cloud Firestore, Authentication, Cloud Messaging (FCM), Remote Config, Dynamic Links, and Cloud Storage.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

## Features

- **Realtime Database**: Read, write, update, push, delete, and query data in Firebase Realtime Database
- **Cloud Firestore**: Full CRUD operations, structured queries, and batch writes for Firestore documents
- **Authentication**: Complete user management including create, update, delete, custom claims, and token operations
- **Cloud Messaging (FCM)**: Send push notifications to devices, topics, and conditions
- **Remote Config**: Manage and publish remote configuration templates
- **Dynamic Links**: Create short links and retrieve link statistics
- **Cloud Storage**: Upload, download, delete files, and manage metadata

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-firebase`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation
cd ~/.n8n

# Install the package
npm install n8n-nodes-firebase
```

### Development Installation

```bash
# Clone or extract the repository
cd n8n-nodes-firebase

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes directory
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-firebase

# Restart n8n
n8n start
```

## Credentials Setup

### Firebase Service Account

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON key file

### Configure in n8n

| Field | Description | Example |
|-------|-------------|---------|
| Project ID | Your Firebase project ID | `my-firebase-project` |
| Service Account Email | Email from the JSON key | `firebase-adminsdk-xxxxx@my-project.iam.gserviceaccount.com` |
| Private Key | Private key from JSON (include BEGIN/END lines) | `-----BEGIN PRIVATE KEY-----\n...` |
| Database URL | Realtime Database URL (optional) | `https://my-project-default-rtdb.firebaseio.com` |

## Resources & Operations

### Realtime Database

| Operation | Description |
|-----------|-------------|
| Read | Read data at a specific path |
| Write | Write/replace data at a path |
| Update | Update existing data (merge) |
| Push | Push new child with auto-generated key |
| Delete | Delete data at a path |
| Query | Query with filters (orderBy, equalTo, limitToFirst, etc.) |

### Cloud Firestore

| Operation | Description |
|-----------|-------------|
| Create Document | Create a new document |
| Get Document | Retrieve a document by ID |
| List Documents | List documents in a collection |
| Update Document | Update document fields |
| Delete Document | Delete a document |
| Query | Run structured queries with filters |
| Batch Write | Execute multiple write operations atomically |

### Authentication

| Operation | Description |
|-----------|-------------|
| Create User | Create a new user account |
| Get User | Get user by UID |
| Get User by Email | Get user by email address |
| List Users | List all users with pagination |
| Update User | Update user properties |
| Delete User | Delete a user account |
| Generate Password Reset Link | Create password reset email link |
| Generate Email Verification Link | Create email verification link |
| Set Custom Claims | Set custom claims on user |
| Revoke Refresh Tokens | Revoke all refresh tokens |

### Cloud Messaging (FCM)

| Operation | Description |
|-----------|-------------|
| Send Message | Send to a single device token |
| Send Multicast | Send to multiple device tokens |
| Send to Topic | Send to all topic subscribers |
| Send to Condition | Send based on topic conditions |
| Subscribe to Topic | Subscribe tokens to a topic |
| Unsubscribe from Topic | Unsubscribe tokens from a topic |

### Remote Config

| Operation | Description |
|-----------|-------------|
| Get Template | Get current config template |
| Publish Template | Publish new template |
| Rollback | Rollback to a previous version |
| List Versions | List template version history |
| Get Conditions | Get template conditions |
| Get Parameters | Get template parameters |

### Dynamic Links

| Operation | Description |
|-----------|-------------|
| Create Short Link | Create a short dynamic link |
| Get Link Stats | Get click statistics for a link |

### Cloud Storage

| Operation | Description |
|-----------|-------------|
| Upload | Upload a file to storage |
| Download | Download a file from storage |
| Delete | Delete a file from storage |
| Get Metadata | Get file metadata |
| Update Metadata | Update file metadata |
| List Files | List files in a bucket/prefix |

## Usage Examples

### Read from Realtime Database

```json
{
  "resource": "realtimeDatabase",
  "operation": "read",
  "path": "users/user123"
}
```

### Create Firestore Document

```json
{
  "resource": "firestore",
  "operation": "createDocument",
  "collectionId": "users",
  "documentId": "user123",
  "fields": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }
}
```

### Send Push Notification

```json
{
  "resource": "messaging",
  "operation": "sendMessage",
  "token": "device_fcm_token",
  "notification": {
    "title": "Hello",
    "body": "You have a new message!"
  },
  "data": {
    "type": "message",
    "id": "123"
  }
}
```

### Create User

```json
{
  "resource": "auth",
  "operation": "createUser",
  "email": "newuser@example.com",
  "password": "securePassword123",
  "displayName": "New User"
}
```

## Firebase Concepts

### Firestore Document Structure

Firestore stores data in documents organized into collections. Each document contains fields with values that can be strings, numbers, booleans, arrays, maps, timestamps, geopoints, or references.

### FCM Message Types

- **Notification messages**: Displayed automatically when app is in background
- **Data messages**: Always handled by app code, regardless of state
- **Combined**: Both notification and data payload

### Remote Config Conditions

Conditions allow you to target specific users based on:
- App version
- Platform (iOS, Android, Web)
- User properties
- Random percentile
- Country/Region

## Error Handling

The node handles Firebase API errors and provides meaningful error messages:

| Error Code | Description |
|------------|-------------|
| 400 | Bad request - invalid parameters |
| 401 | Unauthorized - check credentials |
| 403 | Forbidden - insufficient permissions |
| 404 | Not found - resource doesn't exist |
| 409 | Conflict - resource already exists |
| 429 | Rate limited - too many requests |
| 500 | Server error - Firebase service issue |

## Security Best Practices

1. **Use Service Accounts**: Always use service account credentials for server-side operations
2. **Principle of Least Privilege**: Grant only necessary permissions to service accounts
3. **Secure Key Storage**: Store private keys securely, never commit to version control
4. **Database Rules**: Implement proper Firebase Security Rules
5. **Input Validation**: Validate all user inputs before database operations
6. **Token Rotation**: Regularly rotate service account keys

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Fix linting issues
npm run lint:fix

# Watch mode for development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use

Permitted for personal, educational, research, and internal business use.

### Commercial Use

Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation**: [Firebase Documentation](https://firebase.google.com/docs)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-firebase/issues)
- **n8n Community**: [n8n Community Forum](https://community.n8n.io/)

## Acknowledgments

- [Firebase](https://firebase.google.com/) for providing comprehensive backend services
- [n8n](https://n8n.io/) for the workflow automation platform
- The open-source community for inspiration and support
