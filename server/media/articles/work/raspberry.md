---
{
  "title": "Raspberry Pi Tipps",
  "published_at": "2024-11-01",
  "snippet": "Hilfreiche Tipps ...",
}
---

# Raspberry Pi [^](/articles/)

## Einrichtung

Das ist meine "ohne Gewähr"-Einrichtung, die ich privat mit einem Pi Model 4
benutze – zusammen mit einem lokalen Kubernetes-Cluster mit
[mikrok8s](https://microk8s.io/).

![TwoNodeCluster](images/raspberry.jpg)

### Standard-Einrichtung

#### Raspberry Pi OS installieren:

- Lade den Raspberry Pi Imager von der offiziellen Raspberry Pi-Website herunter
  und schreibe ihn auf die SD-Karte
- Stecke die microSD-Karte in deinen Raspberry Pi und verbinde ihn mit einer
  Stromquelle, einem Monitor, einer Tastatur und einer Maus.
- Folge dem beschriebenen Ablauf
- Du wirst aufgefordert, deine Sprache (Locale) und Wi-Fi einzurichten und ein
  Benutzerkonto anzulegen.
- Aktiviere SSH im Werkzeug 'raspi-config'

#### LEDs ausschalten

Greife auf den Raspberry Pi zu: Melde dich an deinem Raspberry Pi direkt oder
per SSH an. Bearbeite die Datei 'config.txt': Öffne die Datei '/boot/config.txt'
mit Administratorrechten in einem Texteditor wie nano.

```
sudo nano /boot/config.txt
```

Füge die folgenden Zeilen ans Ende der Datei ein:

#### Power-LED ausschalten (Rot)

```
dtparam=pwr_led_activelow=off
```

#### Aktivitäts-LED ausschalten (Grün)

```
dtparam=act_led_trigger=none
dtparam=act_led_activelow=off
```

#### Ethernet-LEDs ausschalten (Grün und Orange)

```
dtparam=eth_led0=14
dtparam=eth_led1=14
Save the file and exit:
```

#### Raspberry Pi neu starten:

```
sudo reboot
```

## Cluster

Einrichtung folgt noch ...
