from scapy.all import sniff, conf, IFACES
from typing import Callable
import time
import threading
from concurrent.futures import ThreadPoolExecutor
import queue
from scapy.layers.inet import IP, TCP, UDP
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def sniff_interface(interface_name: str, callback: Callable):
    def process_packet(packet):
        try:
            print(f"📦 Got packet from {interface_name}: {packet.summary()}")
            callback(packet)
        except Exception as e:
            print(f"Error processing packet on {interface_name}: {e}")

    try:
        print(f"\nНачинаем захват пакетов на интерфейсе {interface_name}...")
        sniff(iface=interface_name,
              prn=process_packet,
              store=0,
              count=0)  # count=0 для бесконечного захвата
    except Exception as e:
        print(f"❌ Ошибка сниффера на интерфейсе {interface_name}: {e}")
        time.sleep(1)
        # Перезапускаем захват на этом интерфейсе
        sniff_interface(interface_name, callback)

def start_sniffing(callback: Callable, interface: str = None):
    """Start packet sniffing with given callback"""
    try:
        sniffer = PacketSniffer(callback, interface)
        sniffer.start()
    except Exception as e:
        logger.error(f"Failed to start sniffer: {e}")
        raise

class PacketSniffer:
    def __init__(self, callback: Callable, interface: str = None):
        self.callback = callback
        self.interface = interface
        self.packet_queue = queue.Queue()
        self.running = False
        self.worker_thread = None
        
    def packet_handler(self, packet):
        """Handle captured packets and put them in queue"""
        try:
            if IP in packet:  # Only process IP packets
                self.packet_queue.put(packet)
        except Exception as e:
            logger.error(f"Error handling packet: {e}")
    
    def process_packets(self):
        """Process packets from queue and call callback"""
        while self.running:
            try:
                packet = self.packet_queue.get(timeout=1)
                self.callback(packet)
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error processing packet: {e}")
    
    def start(self):
        """Start packet capture"""
        self.running = True
        
        # Start packet processing worker
        self.worker_thread = threading.Thread(target=self.process_packets)
        self.worker_thread.daemon = True
        self.worker_thread.start()
        
        try:
            # Start packet capture
            sniff(
                prn=self.packet_handler,
                store=False,
                iface=self.interface,
                filter="ip",  # Capture only IP packets
            )
        except Exception as e:
            logger.error(f"Error in packet capture: {e}")
            self.stop()
    
    def stop(self):
        """Stop packet capture"""
        self.running = False
        if self.worker_thread:
            self.worker_thread.join()
