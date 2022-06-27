---
title: Windows subsystem for Linux - tips, tricks and notes
date: 2022-06-26 12:42:06.000000000 +05:30
classes: wide
published: true
categories:
- Articles
- Tutorial
tags:
- tips
- linux
- workspace
header:
  teaser: "images/posts/wslTips/WSL_tips.png"
  og_image: "images/posts/wslTips/WSL_tips.png"
excerpt: "Some quick notes, tips and tricks to use WSL as a work environment when you are stuck with a Windows PC"

---


<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
</style>

{% include base_path %}

{% include toc title="Table of contents" icon="file-text" %}

## Enabling internet in WSL while connected to VPN

By default, WSL is not connected to the internet when connected to your VPN. To enable internet access, you need to do the following:


> Source [Stackoverflow](https://superuser.com/questions/1630487/no-internet-connection-ubuntu-wsl-while-vpn)
> The following is a verbatim copy from stackoverflow.com


1. Find out nameserver with windows powershell (during VPN Session)

    ```bash
    nslookup
    ```

    You'll get the IPv4 address of your corporate nameserver. Copy this address.

2. Disable `resolv.conf` generation in wsl:

    ```bash
    sudo vi /etc/wsl.conf
    ```

    Copy this text to the file (to disable `resolve.conf` generation, when wsl starts up)

    ```bash
    [network]                                                                        
    generateResolvConf = false
    ```

3. In wsl Add your corporate nameserver to `resolv.conf`

    ```bash
    sudo vi /etc/resolv.conf
    ```

    Remove other entries and add your corporate nameserver IP (if you have a secondary nameserver, add it in a separate line)

    - nameserver `X.X.X.X` (where `X.X.X.X` is your address obtained in step 1)

4. Set your VPN adapter (if you have Cisco AnyConnect) open a admin powershell

    - Find out your VPN adapter name: Get-NetIPInterface (in my case: "Cisco AnyConnect")
    - Set adapter metric (Replace -Match with your name), in my case I have to run this after ever reboot or VPN reconnect:

    ```bash
    Get-NetAdapter | Where-Object {$_.InterfaceDescription -Match "Cisco AnyConnect"} | Set-NetIPInterface -InterfaceMetric 6000
    ```

    ([What is interface metric](https://docs.microsoft.com/en-us/troubleshoot/windows-server/networking/automatic-metric-for-ipv4-routes): Used to determine route, windows use interface with lowest metric)

5. Restart wsl in powershell: `wsl.exe --shutdown`

6. Test it in wsl run: `ping google.com` - if this command works, you are done.


In my case I get DNS issues when try to connect to internal stuff via browser (on Windows 10, f.e.: intranet), caused by the high metric value set in step 4 (basically kind of disabling VPN Route). So here is the workaround for the workaround:

1. Check your default metric (of VPNs Interface) **in powershell** (replace `-Match` with your interface name)

    ```bash
    Get-NetAdapter | Where-Object {$_.InterfaceDescription -Match "Cisco AnyConnect"} | Get-NetIPInterface
    ```

2. When running into problems on Windows 10 restore this default value with **admin powershell** (replace value at the end with your default value):

    ```bash
    Get-NetAdapter | Where-Object {$_.InterfaceDescription -Match "Cisco AnyConnect"} | Set-NetIPInterface -InterfaceMetric 1
    ```

## Bridge between windows pageant and wsl

Pageant is an SSH authentication agent. It holds your private keys in memory, already decoded, so that you can use them often without needing to type a passphrase every time. In my windows machine, I load my primary keys into Pagent at startup and then use [wsl2-ssh-pageant](https://github.com/BlackReloaded/wsl2-ssh-pageant) to bridge between WSL and pageant. This is a simple script that runs in WSL and connects to the pageant daemon on the Windows machine and I don't have to copy my private keys to the WSL machine.

Download and setup instructions are available in the [wsl2-ssh-pageant](https://github.com/BlackReloaded/wsl2-ssh-pageant) GitHub page. However, the `.bashrc` entry prints warnings from `ss` at startup. Since these are harmless, I am routing them to `/dev/null` with the modification below. (Only line2 is modified from the original instructions)


  ```bash
  export SSH_AUTH_SOCK="$HOME/.ssh/agent.sock"
  if ! ss -a 2>/dev/null | grep -q "$SSH_AUTH_SOCK"; then
  rm -f "$SSH_AUTH_SOCK"
  wsl2_ssh_pageant_bin="$HOME/.ssh/wsl2-ssh-pageant.exe"
  if test -x "$wsl2_ssh_pageant_bin"; then
      (setsid nohup socat UNIX-LISTEN:"$SSH_AUTH_SOCK,fork" EXEC:"$wsl2_ssh_pageant_bin" >/dev/null 2>&1 &)
  else
      echo >&2 "WARNING: $wsl2_ssh_pageant_bin is not executable."
  fi
  unset wsl2_ssh_pageant_bin
  fi
  ```
