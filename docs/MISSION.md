# Elvan Forge LLC: Mission & Engineering Principles

## Mission
To build high-performance, engineer-first tools that simplify complex data and payments, while maintaining the highest standards of digital ethics.

## Core Principles

### 1. Data Stewardship & Security (Priority Zero)
We are the guardians of user and student information. We do not just "store" data; we protect it.
* **Minimalism:** Collect only the data absolutely necessary for the service. If we don't need it, we don't store it.
* **Security by Design:** All AI interactions must be sanitized. Never suggest or implement code that exposes PII (Personally Identifiable Information) or security credentials to client-side logs or third-party APIs without encryption.
* **Breach Prevention:** Favor hardened, well-vetted standard libraries over obscure third-party packages. Every piece of code must be written as if it will be audited by a security professional.

### 2. Speed as a Feature
Performance is a form of respect for the user's time. 
* Use **Go** for the backend to ensure memory safety and high concurrency. 
* Use **Svelte 5 (Runes)** for a lightweight, reactive frontend without the overhead of heavy virtual DOMs.

### 3. Professionalism & Reproducibility
* **The Audit Trail:** Every change must be documented via feature branches and descriptive Pull Requests.
* **No "Slop":** We do not accept "copy-paste" code that isn't fully understood. AI-generated code must be scrutinized for logic leaks and security vulnerabilities before being merged.

### 4. Financial Integrity
We use industry-standard payment processors (Stripe). We never handle or store raw credit card data on Elvan Forge infrastructure. 