---
{
  "title": "Raspberry Pi hints",
  "published_at": "2024-11-01",
  "snippet": "Helpful hints ...",
}
---

# Raspberry Pi [^](/articles/)

## Setup

This is the "no warranty" setup I use for my personal use of a Pi Model 4. and
use of a local Kubenetes cluster using [mikrok8s](https://microk8s.io/).

![TwoNodeCluster](images/raspberry.jpg)

### Default Setup

#### Install Raspberry Pi OS:

- Download the Raspberry Pi Imager from the official Raspberry Pi website and
  write it to SD dard
- Insert the microSD card into your Raspberry Pi and connect it to a power
  source, monitor, keyboard, and mouse.
- Follow the process as discribed
- You'll be asked to set up your locale, Wi-Fi, and create a user account.
- Enable SSH in 'raspi-config' tool

#### Disable LEDs

Access the Raspberry Pi: Log in to your Raspberry Pi either directly or via SSH.
Edit the 'config.txt' file: Open the '/boot/config.txt' file with administrator
privileges using a text editor like nano.

```
sudo nano /boot/config.txt
```

Add the following lines to the end of the file:

#### Disable Power LED (Red)

```
dtparam=pwr_led_activelow=off
```

#### Disable Activity LED (Green)

```
dtparam=act_led_trigger=none
dtparam=act_led_activelow=off
```

#### Disable Ethernet LEDs (Green and Orange)

```
dtparam=eth_led0=14
dtparam=eth_led1=14
Save the file and exit:
```

#### Reboot the Raspberry Pi:

```
sudo reboot
```

## Cluster

Setup to come ...
