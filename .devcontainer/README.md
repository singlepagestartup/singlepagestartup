# GitHub Codespaces

For GitHub Codespaces you need to add SSH key manually, only default codespace container connects to account automatically.

In started container run commands:

```
ssh -T git@github.com

The authenticity of host 'github.com (20.26.156.215)' can't be established.
ED25519 key fingerprint is SHA256:
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])?

<!-- Type 'yes' -->
```

```
ls ~/.ssh

<!-- You will see something like that -->
ls: cannot access '/home/node/.ssh': No such file or directory
```

```
ssh-keygen -t ed25519 -C "your@email.com"

<!-- You will see -->
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/node/.ssh/id_ed25519):
<!-- Type 'yes' -->

Enter passphrase (empty for no passphrase):
<!-- Press 'Enter' -->

Enter same passphrase again:
<!-- Press 'Enter' -->

The key's randomart image is:
+--[ED25519 256]--+
...
+----[SHA256]-----+

<!-- Your SSH key is generated -->
```

```
cat ~/.ssh/id_ed25519.pub

ssh-ed25519 ....
```

Copy text and paste it to [GitHub Add New SSH Key](https://github.com/settings/ssh/new)
As a name you can use your container name.

```
ssh -T git@github.com

<!-- You will get -->
Hi Name! You've successfully authenticated, but GitHub does not provide shell access.
```

```
git remote set-url origin git@github.com:<name_of_repo_with_user>.git

<!-- Example -->
git remote add origin git@github.com:singlepagestartup/singlepagestartup.git
```

```
git remote -v
<!-- Shoud has your repo -->
origin  git@github.com:singlepagestartup/singlepagestartup.git (fetch)
origin  git@github.com:singlepagestartup/singlepagestartup.git (push)

git fetch origin
<!-- You will get -->
remote: Enumerating objects: 253217, done.
remote: Counting objects: 100% (46143/46143), done...

git branch
<!-- Sould be 'main' -->

git fetch origin

git pull origin main
<!-- You will get -->
From github.com:singlepagestartup/singlepagestartup
 * branch                main       -> FETCH_HEAD
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
```
