---
title: Guts of Git - A deep dive into the internals of the Git version control system
date: 2023-06-16 22:10:06.000000000 -07:00
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- Git
- Configuration management
- Version control

header:
  teaser: "images/posts/gitGuts/gitgut_poster.png"
  og_image: "images/posts/gitGuts/gitgut_poster.png"
excerpt: "Recently, I experienced a workplace Git incident that compelled me to refresh my understanding of Git internals and learn numerous new aspects about the system. This article is a product of that learning experience, with the hope that even my worst adversaries will never have to endure such pain. I hope you find this article useful and acquire new insights into Git." 

---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

{% include toc title="Table of contents" icon="file-text" %}

## Introduction

I am not going to re-iterate what Git is and why it is so popular. There are plenty of articles and videos out there that do a great job of explaining that. I am going to assume that you already know what Git is and how to use it. If you don't, I would recommend you to go through the [official Git documentation](https://git-scm.com/doc) and [Pro Git book](https://git-scm.com/book/en/v2) before reading this article.

The target audience for this article is the curious ones who wants to waddle in the internals of Git and learn how it works under the hood. 


## How does Git store data?

When you run `git init` in a directory, Git creates a `.git` directory in that directory. This `.git` directory is where Git stores all the data related to the repository. Let's take a look at the contents of the `.git` directory.

```bash
.git/
├── branches
├── config
├── description
├── HEAD
├── hooks
│   ├── applypatch-msg.sample
│   ├── commit-msg.sample
│   ├── fsmonitor-watchman.sample
│   ├── post-update.sample
│   ├── pre-applypatch.sample
│   ├── pre-commit.sample
│   ├── pre-merge-commit.sample
│   ├── prepare-commit-msg.sample
│   ├── pre-push.sample
│   ├── pre-rebase.sample
│   ├── pre-receive.sample
│   ├── push-to-checkout.sample
│   └── update.sample
├── info
│   └── exclude
├── objects
│   ├── info
│   └── pack
└── refs
    ├── heads
    └── tags
```

The `.git` directory contains a bunch of files and directories. Let's take a look at each of them.

| File/Dir    | Contents                                                                                                                                                                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| branches    | directory that contains the list of branches in the repository. The branch info is stored in the form of a file with the branch name as the filename and the contents of the file being the commit hash of the latest commit in that branch.                                        |
| config      | file that contains the configuration of the repository. This can be used to override the global configuration. this file also contains the remote repository information.                                                                                                           |
| description | file that contains the description of the repository. This is used by GitWeb to display the description of the repository.                                                                                                                                                          |
| HEAD        | file that contains the reference to the current branch. We will talk more about what a reference is later in this article.                                                                                                                                                          |
| hooks       | directory that contains the hooks that can be used to trigger custom actions at various stages of the Git workflow. We will not go into the details of hooks in this article. The .sample files are the sample hooks that can be used as a starting point for writing custom hooks. |
| info        | directory that contains the global exclude file. This file contains the list of files that should be ignored by Git. As the repository grows, additional information like the list of alternates and the list of grafts are stored in this directory.                               |
| objects     | directory that contains the actual data of the repository. This is where Git stores all the commits, trees, blobs, and tags.                                                                                                                                                        |
| refs        | directory that contains the references to the commits. We will talk more about what a reference is later in this article.                                                                                                                                                           |

## How does Git store commits?

### git objects

We will use a non-conventional approach to committing a file into git to understand how Git stores commits.

First, lets create a new file with some content in it.

```bash
echo "Hello World" > hello.txt
```

Now, we will use the `git hash-object` command to create a blob object from the file.

```bash
$ git -w hash-object hello.txt
557db03de997c86a4a028e1ebd3a1ceb225be238
```

The `-w` flag tells Git to write the object to the object database. The `hash-object` command returns the SHA-1 hash of the object that was created. The SHA-1 hash of the object is the name of the file that is created in the object database. Let's take a look at the contents of the object database.

```bash
.git/
├── branches
├── config
├── description
├── HEAD
├── hooks
├── info
│   └── exclude
├── objects
│   ├── 55
│   │   └── 7db03de997c86a4a028e1ebd3a1ceb225be238
│   ├── info
│   └── pack
└── refs
    ├── heads
    └── tags
```

Git stores contents in an object using its own custom format that includes a zlib compressed version of the contents, the type of the object, and the size of the contents. The type of the object is stored as a header in the object. some key type of the object are as follows (not all object types are covered).

| Type   | Description                                                                 |
| ------ | --------------------------------------------------------------------------- |
| blob   | A blob object represents the contents of a file.                             |
| tree   | A tree object represents the contents of a directory.                        |
| commit | A commit object represents a commit.                                         |
| tag    | A tag object represents a tag.                                               |


A `python` routine to read the contents of the object is shown below.

```python
import zlib
import hashlib

def read_object(sha):
    with open('.git/objects/' + sha[:2] + '/' + sha[2:], 'rb') as f:
        raw = zlib.decompress(f.read())
        return raw

print(read_object('557db03de997c86a4a028e1ebd3a1ceb225be238')) # use .decode() to print the contents of the object
```

The oputput of the above program is shown below.

```bash
b'blob 12\x00Hello World\n'
```

We have just created a loose object that is not part of anything tracked by Git. But we can use teh `git show` or `git cat-file -p` command to view the contents of the object.

```bash
$ git cat-file -p 557db03d
Hello World
```

We can even use a python routine to create a loose object.

```python
import zlib
import hashlib
import os

def write_object(data, type):
    header = type + ' ' + str(len(data)) + '\x00'
    store = header.encode() + data
    sha = hashlib.sha1(store).hexdigest()
    if not os.path.exists('.git/objects/' + sha[:2]):
        os.makedirs('.git/objects/' + sha[:2])
    with open('.git/objects/' + sha[:2] + '/' + sha[2:], 'wb') as out:
        out.write(zlib.compress(store))
    return sha

print(write_object(b'Hello New World\n', 'blob'))
```

The program will create a loose object in the object database and return the SHA-1 hash of the object.

```bash
d9786ef99a397ad94795405041cb9590712053f6
```

```bash
.git/
├── branches
├── config
├── description
├── HEAD
├── hooks
├── info
│   └── exclude
├── objects
│   ├── 55
│   │   └── 7db03de997c86a4a028e1ebd3a1ceb225be238
│   ├── d9
│   │   └── 786ef99a397ad94795405041cb9590712053f6
│   ├── info
│   └── pack
└── refs
    ├── heads
    └── tags
```

Contents of this new file can be viewed using the `git cat-file -p` command.

```bash
$ git cat-file -p d9786ef9
Hello New World
```

Though there is a new object, there is no file in our working directory with this contents. 

```bash
$ ls
hello.txt
```

As you would have noticed, there is no information about the file name or the directory structure in the object. This is because Git does not store the file name or the directory structure in the object. Git only stores the contents of the file in the object. The file name and the directory structure is stored in a tree object. Lets create a tree object and see how it is stored in the object database.

### The tree object

Git stores a group of files and directories in a tree object. A tree object is a essentially a directory that contains other trees and blobs. Lets create a tree object that contains the two objects we created earlier.

For this, we need to first stage the two files in the index. We can do this using the `git update-index` command. 

```bash
$ git update-index --add --cacheinfo 100644 557db03d hello.txt
$ git update-index --add --cacheinfo 100644 d9786ef9 hello2.txt
```

In this case, you’re specifying a mode of `100644`, which means it’s a normal file. Other options are `100755`, which means it’s an executable file; and `120000`, which specifies a symbolic link. The mode is taken from normal UNIX modes but is much less flexible.

Now you can see that there is a new `index` file in the `.git` directory.

The `index` file has a git internal format that is documented in the [git documentation](https://git-scm.com/docs/index-format). We can use the `git ls-files --stage` command to view the contents of the index file.

```bash
$ git ls-files --stage

100644 557db03de997c86a4a028e1ebd3a1ceb225be238 0       hello.txt
100644 d9786ef99a397ad94795405041cb9590712053f6 0       hello2.txt

```

Issuing a `git status` will show that there are two files that are available to commit, even though there is no second file in the working directory.

```bash
$ git status

On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   hello.txt
        new file:   hello2.txt

Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        deleted:    hello2.txt
```

Since the `hello2.txt` file is not present on disk, git sees it as a delete operation. We can use the `git restore hello2.txt` command that will create the `hello2.txt` file in the working directory with contents from the `index` and the `object` we created earlier. But this step is not necessary for us to create the tree object.

When we issue the `git write-tree` command, git will create a tree object that contains the two files we added to the index. The tree object will be stored in the object database and the SHA-1 hash of the tree object will be returned.

```bash
$ git write-tree
60fdbb80045aca16edfa035e7a4b7b2ce5ebe5aa
```

We can use the `git cat-file ` command to view the contents of the tree object.

```bash
$ git cat-file -t 60fdbb80
tree
$ git cat-file -p 60fdbb80
100644 blob 557db03de997c86a4a028e1ebd3a1ceb225be238    hello.txt
100644 blob d9786ef99a397ad94795405041cb9590712053f6    hello2.txt
```

The tree object contains the file mode, the type of the object (blob or tree) and the `SHA-1` hash of the object.

The `git read-tree` command can be used to read the contents of a tree object into the index. This is useful when you want to checkout a commit. The `git read-tree` command will read the contents of the tree object into the index and the `git checkout-index` command will create the files in the working directory.

```bash
$ git read-tree 60fdbb80
$ git checkout-index -a
```

### commit objects

A commit object is a git object that contains the commit message, the author, the committer and the tree object that represents the contents of the commit. Lets create a commit object that contains the tree object we created earlier.

```bash
$ git commit-tree 60fdbb80 -m "Initial commit"
efb4ebf62f7ec3e9e078f232ef0f00a175140046
```

Ans the commit object contents can be viewed using the `git cat-file` command.

```bash
$ git cat-file -p efb4ebf6

tree 60fdbb80045aca16edfa035e7a4b7b2ce5ebe5aa
author vpillai <vysakhpillai@embeddedinn.xyz> 1686972765 -0700
committer vpillai <vysakhpillai@embeddedinn.xyz> 1686972765 -0700

Initial commit
```

We can also use the `git log` command to view the commit history.

```bash
$ git log --stat efb4ebf6
Author: vpillai <vysakhpillai@embeddedinn.xyz>
Date:   Fri Jun 16 20:32:45 2023 -0700

    Initial commit

 hello.txt  | 1 +
 hello2.txt | 1 +
 2 files changed, 2 insertions(+)
```

But `git status` still reports that there are no commits.

```bash
$ git status

On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   hello.txt
        new file:   hello2.txt
```

This is because the `HEAD` reference is still pointing to the `main` branch that does not have a corresponding ref entry. We can use the `git update-ref` command to update the `HEAD` reference to point to the commit object we created earlier.

```bash
$ git update-ref refs/heads/main efb4ebf6
```

This creates a new file in the `.git/refs/heads` directory that contains the `SHA-1` hash of the commit object.

```bash
$ cat .git/refs/heads/main
efb4ebf62f7ec3e9e078f232ef0f00a175140046
```

An entry is also created in the `logs/refs/heads` directory that contains the `SHA-1` hash of the commit object and the commit message.

```bash
$ cat .git/logs/refs/heads/main
0000000000000000000000000000000000000000 efb4ebf62f7ec3e9e078f232ef0f00a175140046 vpillai <vysakhpillai@embeddedinn.xyz> 1686973167 -0700
```

This entry says that main moved from `00` to `efb4ebf6`. The `00` is the `SHA-1` hash of the empty tree object. The `git log` command will now show the commit we created earlier.

```bash
$ git log 
commit efb4ebf62f7ec3e9e078f232ef0f00a175140046 (HEAD -> main)
Author: vpillai <vysakhpillai@embeddedinn.xyz>
Date:   Fri Jun 16 20:32:45 2023 -0700

    Initial commit
```

### refs

The `refs` directory contains the references to the commit objects. The `HEAD` reference is a symbolic reference that points to the current branch. The `HEAD` reference is stored in the `.git/HEAD` file.

```bash
$ cat .git/HEAD
ref: refs/heads/main
```

The `refs/heads` directory contains the references to the branches. The `refs/tags` directory contains the references to the tags. The `refs/remotes` directory contains the references to the remote branches.

### branches

A branch is a reference to a commit object. When a new branch is created, a new file is created in the `.git/refs/heads` directory that contains the `SHA-1` hash of the commit object. Lets create a new branch called `dev` and checkout the branch using low level git commands.

```bash
$ git update-ref refs/heads/dev efb4ebf6
```

A new branch is now created

```bash
$ git branch
  dev
* main
```

This creates a new file in the `.git/refs/heads` directory and the `.git/log/refs/heads` directory that contains the `SHA-1` hash of the commit object.

```bash
.git/
├── branches
├── config
├── description
├── HEAD
├── hooks
├── index
├── info
│   └── exclude
├── logs
│   ├── HEAD
│   └── refs
│       └── heads
│           ├── dev
│           └── main
├── objects
│   ├── 55
│   │   └── 7db03de997c86a4a028e1ebd3a1ceb225be238
│   ├── 60
│   │   └── fdbb80045aca16edfa035e7a4b7b2ce5ebe5aa
│   ├── d9
│   │   └── 786ef99a397ad94795405041cb9590712053f6
│   ├── ef
│   │   └── b4ebf62f7ec3e9e078f232ef0f00a175140046
│   ├── info
│   └── pack
└── refs
    ├── heads
    │   ├── dev
    │   └── main
    └── tags
```

At this stage, main and dev are pointing to the same commit object. Checking out the new branch simply means updating the `HEAD` reference to point to the new branch. Instead of using `git update-ref HEAD refs/heads/dev`, we can simply update the contents of the `.git/HEAD` file to point git to the new branch.

```bash
$ echo "ref: refs/heads/dev" > .git/HEAD
```

```bash 
 $ git branch
* dev
  main
```

Now, we can create a new commit on the `dev` branch, but stil using the low level git commands.

```bash
#update the file
$ echo "Hello World Uno" > hello.txt

# create a new object for the file
$ git hash-object -w hello.txt
2a323159bea5a5bf98c0ccaef350cd6141f0f3df


$ git update-index --add --cacheinfo 100644 2a323159 hello.txt

$ git status

On branch dev
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   hello.txt

# add sub tree

$ git write-tree
e0aefbba82dd2e7653ae6d46f00bbed584fac52f

# commit tree with parent
$ git commit-tree e0aefbba -p efb4ebf6 -m "Commit to dev"
152b7866c2e126eec65bafec327d9d760bef99c7

# make dev point to the new commit
$ git update-ref refs/heads/dev 152b7866

# check status
$ git status
On branch dev
nothing to commit, working tree clean

# check log
$ cat .git/logs/refs/heads/dev
0000000000000000000000000000000000000000 efb4ebf62f7ec3e9e078f232ef0f00a175140046 vpillai <vysakhpillai@embeddedinn.xyz> 1686974500 -0700
efb4ebf62f7ec3e9e078f232ef0f00a175140046 152b7866c2e126eec65bafec327d9d760bef99c7 vpillai <vysakhpillai@embeddedinn.xyz> 1686974696 -0700
```

## Diff

Lets look a how Git handles incremental changes. For this, we will start with a clean repository.

```bash
$ git init
$ echo "Hello World" > hello.txt
$ git add hello.txt
$ git commit -m "Initial commit"
```

```bash
.git/
├── branches
├── COMMIT_EDITMSG
├── config
├── description
├── HEAD
├── hooks
├── index
├── info
│   └── exclude
├── logs
│   ├── HEAD
│   └── refs
│       └── heads
│           └── main
├── objects
│   ├── 3c
│   │   └── 80f66564c9ee69d0987e48a545becc3025deb1
│   ├── 55
│   │   └── 7db03de997c86a4a028e1ebd3a1ceb225be238
│   ├── 97
│   │   └── b49d4c943e3715fe30f141cc6f27a8548cee0e
│   ├── info
│   └── pack
└── refs
    ├── heads
    │   └── main
    └── tags
```


```bash
# check the tree contents
$ git cat-file -p 97b49d4c
100644 blob 557db03de997c86a4a028e1ebd3a1ceb225be238    hello.txt
```

Now, lets update the file and commit the changes.

```bash
$ echo "Hello World Uno" > hello.txt
$ git add hello.txt
$ git commit -m "Update hello.txt"
```

This created 3 new objects:

|Type|Object hash|
|----|-----------|
|blob|2a323159|
|tree|106ed651|
|commit|06a73f25|

The blob contains the entire contents of the updated file (not just the diff). The tree contains the updated blob and the commit contains the updated tree.

```bash
$ git cat-file -p 557db03d
Hello World

$ git cat-file -p 2a323159
Hello World Uno
```

`git log` shows the commit history including the two commit objects. they are linked by the `parent` field in the commit object.

```bash
$ git cat-file -p 06a73f25
tree 106ed65198ebfbde9f4e7e8bd6ceb2dd2e5268ce
parent 3c80f66564c9ee69d0987e48a545becc3025deb1
author vpillai <vysakhpillai@embeddedinn.xyz> 1686976022 -0700
committer vpillai <vysakhpillai@embeddedinn.xyz> 1686976022 -0700
```

This tree information can be visualized using standard git commands.

```bash
$ git log --graph --oneline --decorate --all
* 06a73f2 (HEAD -> main) Update hello.txt
* 3c80f66 Initial commit
```

## Conclusion

This article is a brief introduction to the internals of Git. It is by no means a complete guide. The goal was to understand the basic concepts and to get a feel for how basic Git operations works. The next article will cover the internals of the `git add` command and how it interacts with the `index` and the working tree.
