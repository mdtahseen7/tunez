// Global DNS configuration: ensure Node returns records in original order (no reordering)
// Helpful for environments where IPv4/IPv6 order matters.
import dns from "dns";

// Optional chaining in case older Node versions lack this method
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("verbatim");
}
