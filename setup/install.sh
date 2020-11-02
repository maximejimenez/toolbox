#!/bin/bash

# Install xcode
xcode-select --install

# Install brew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

# Install apps using brew
brew bundle

# Install Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"

# Set zsh as default shell
chsh -s $(which zsh)

# Install autosuggestions plugin for zsh
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# Backup zshrc that was created
mv ~/.zshrc ~/.zshrc.init.old

# Copy my .zshrc and custom commands
cp ./.custom-commands ~/.custom-commands
cp ./.zshrc ~/.zshrc

# Install nvm 
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.36.0/install.sh | zsh


