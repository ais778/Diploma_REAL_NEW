from scapy.all import sniff
from typing import Callable

def start_sniffing(callback: Callable):
    def process_packet(packet):
        callback(packet)

    sniff(prn=process_packet, store=0)
