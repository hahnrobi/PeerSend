#!/bin/bash

# Extract tag version from the environment (GITHUB_REF or passed argument)
TAG_VERSION=${1:-$(git describe --tags --abbrev=0)}

# Remove the 'v' prefix if it exists
VERSION=${TAG_VERSION#v}

echo "Updating package.json version to $VERSION"

# Update package.json version
node -e "let pkg=require('./package.json'); pkg.version='$VERSION'; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

echo "Updated package.json with version $VERSION"
