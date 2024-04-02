---
title: Vysakh P Pillai's Curriculum Vitae
layout: single
date: 2024-04-02 06:00:06.000000000 -07:00
classes: wide
published: true
read_time: false
comments: false
show_date: true
recent_posts: false
author_profile: true
no_coffee: true
permalink: /cv

---

<style>
div {
  text-align: justify;
  text-justify: inter-word;
}
.page__content p, .page__content li, .page__content dl {
    font-size: 0.8em !important;
}
.download-button {
  display: inline-block;
  background-color: rgba(0, 140, 186, 0.7); /* Blue */
  border: none;
  color: white !important; /* Add !important to force this color */
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  position: absolute; /* Start with absolute positioning */
  top: 10px; /* Adjust as needed */
  right: 10px; /* Adjust as needed */
  border-radius: 12px; /* Add this line to make the corners rounded */
}

@media screen and (max-width: 600px) {
  .download-button {
    font-size: 12px;
    padding: 10px 20px;
  }
}

.fixed {
  position: fixed; /* Switch to fixed positioning when scrolling */
}
</style>

<script>
window.addEventListener('scroll', function() {
  var downloadButton = document.getElementById('downloadButton');
  var top = downloadButton.offsetTop;
  if (window.pageYOffset > top) {
    downloadButton.classList.add('fixed');
  } else {
    downloadButton.classList.remove('fixed');
  }
});
</script>

{% include base_path %}

## PROFESSIONAL SUMMARY

Seasoned Technical Staff Software Engineer and Secure Systems Architect with 14+ years in the semiconductor industry. Specializes in high performance System-on-Chip Software, System Security & Device Drivers. Adept at Python, System Integration, DevOps, and Cloud Architectures. Proven track record leading cross-functional teams from conception to implementation and customer delivery. Strong communicator and proactive team player dedicated to delivering top-notch results.

<!--Button to download 2 page resume PDF -->
<a href="/_pages/vysakh_pillai-resume.pdf" id="downloadButton" class="download-button">2 Page Resume</a>

## EDUCATION

**Master of Science, Digital Design and Embedded System**  
*Manipal Academy of Higher Education, Manipal, India*  
*January 2011 - February 2013*

**Bachelor of Technology, Electronics and Communication Engineering**  
*Amrita Vishwa Vidyapeetham, Kollam, India*  
*May 2005 - May 2009*

## PROFESSIONAL EXPERIENCE

### **Technical Staff Engineer – Software**  
*Microchip Technology, Burnaby, British Columbia, Canada*  
*April 2022 - Present*

  **RESPONSIBILITIES**
  - Led as System Firmware Architect for the Security Subsystem for the first-generation RISC-V based High-Performance Spaceflight Computing (HPSC) System-on-Chip (SoC).
  - Developed a heterogeneous RISC-V core software emulation platform using QEMU, driving pre-silicon development and early customer engagement.
  - Engineered robust early-boot architecture for Linux and application software systems, optimizing system resilience.
  - End-to-end design and development of a Secure System Boot ROM.
  - Implemented buildroot-based Linux System on QEMU and Protium emulation systems, ensuring easy pre-silicon development.
  - Created a bespoke Debian distribution and apt-repo for a RISC-V System, enhancing performance and compatibility.
  - Established release infrastructure and DevOps systems, streamlining processes for early customer adoption.

### **Technical Staff Engineer - Software**  
*Microchip Technology India Pvt. Ltd., Bangalore, India*  
*February 2015 - April 2022*

  **RESPONSIBILITIES**

  -	Applications lead for new Wi-Fi and BLE IoT silicon development at the wireless solutions group.
  -	E2E Systems architect for cloud, serverless & mobile connectivity, end-node authentication & device security. 
  -	Post silicon bring-up and validation of SoC, RF modules, and development boards.
  -	Design and architecture of bootloaders, OTA, and compiler features for RTOS-based and bare-metal secure wireless solutions.
  -	Voice control interfacing using Amazon Alexa™ and Google Assistant™.
  -	Manufacturing co-ordination and lead architect for apps DevOps framework.

### **Software Engineer**  
*Cisco Systems India Pvt Ltd, Bangalore, India*  
*August 2011 - January 2015*

  **RESPONSIBILITIES**

  -	Linux Device Driver development for high-end set-top box peripherals.
  -	Development and integration of networked personalization features for STBs.
  -	Security module integration of cable card and legacy security modules. 
  -	End to end system integration and performance optimization.
  -	Build and test automation, process improvement, and release management.  
  -	Building proof of concepts for next-generation product ideas.

### **Software Engineer**  
*Sasken Technologies Ltd, Bangalore, India*  
*March 2010 - January 2011*

  **RESPONSIBILITIES**

  -	Implementation of embedded system software as per design specification.
  -	Maintenance activities on existing software.
  -	Forward and backward porting of drivers and protocol layers. 
  -	Interaction with the client for the above activities and to provide support.

### **Research and teaching assistant**
*Amrita University*  
*August 2009 – March 2010*

  **RESPONSIBILITIES**

  -	End-to-end design and implementation of embedded systems of medium to large scale complexity.
  -	65nm early-process setup using Mentor Graphics Tooling.
  -	Client interaction and requirement gathering.
  -	Teaching responsibilities.

### **Technology Freelancing**

  Seek challenging and interesting technical jobs that can be done within a small period utilizing personal free time resulting in technical growth.


## SKILLS & TECHNOLOGIES

- **Programming Languages**        : C, Python, Shell Scripting, HTML, JavaScript.
- **Firmware Development**         : Embedded C, RTOS, Device Drivers, Bootloaders.
- **Embedded Systems**             : MIPS, RISC-V, Microcontrollers, SoCs, Wi-Fi, BLE, IoT.
- **Version Control Systems**      : Git (Bitbucket, GitHub, GitLab).
- **Debugging and Testing**        : JTAG, GDB, Lauterbach, JIRA, Jenkins, Confluence.
- **Communication Protocols**      : UART, SPI, I2C, USB, Ethernet, TCP/IP, MQTT, Wi-Fi, BLE.
- **Problem-solving**              : System Architecture, Design, and Debugging.
- **Security**                     : Secure Boot, Secure Firmware Update, Secure Communication.
- **Cloud Technologies**           : AWS, Azure IoT, Google Cloud IoT, Docker.
- **Tools**                        : MPLAB X, TPDS, Jupyter Notebook, Visual Studio Code, WSL.
- **Operating Systems**            : Linux, Windows, FreeRTOS.

## CERTIFICATIONS

**Applications of TinyML**  
*HarvardX*  
Issued Jan 2022  
[View Certificate](https://courses.edx.org/certificates/9c1798c7c8224e438ba758240e679e52)

**Deploying TinyML**  
*HarvardX*  
Issued Jan 2022  
[View Certificate](https://courses.edx.org/certificates/36983a3194464a10896a5d4b626b0fd1)

**Fundamentals of TinyML**  
*HarvardX*  
Issued Jan 2022  
[View Certificate](https://courses.edx.org/certificates/4678189a89aa4a36a2cd4076be20fcd9)

**Professional Certificate in Tiny Machine Learning (TinyML)**  
*HarvardX*  
Issued Jan 2022  
[View Certificate](https://credentials.edx.org/credentials/720c5858d05242f481be79616537ae03/)

**Trust Platform Design Suite v2**  
*Microchip Technology Inc.*  
Issued Dec 2021  
[View Certificate](https://verify.skilljar.com/c/naaocueohzwe)  

**AWS IoT: Developing and Deploying an Internet of Things**  
*Coursera*  
Issued Oct 2021  
[View Certificate](https://www.coursera.org/account/accomplishments/certificate/TW3GK7LLCR8S)  

## PROFESSIONAL PROJECTS

### 1. <u>Security Subsystem Firmware Architecture - HPSC</u>

*Microchip Technology, Canada, 2024*

Led the architectural design and implementation of platfrom firmware security solutions for the First-Generation RISC-V based HPSC system, Collaborated closely with design, product engineering, and application teams to integrate security measures throughout the device development lifecycle.

  **Achievements**
  - Architected comprehensive system firmware security solutions, ensuring robust protection for the HPSC platform against potential vulnerabilities.
  - Facilitated seamless coordination among diverse teams, fostering effective communication and synergy between design, product engineering, and application teams.
  - Orchestrated collaboration with Hardware Security Module (HSM) vendors and cross-functional business units, resulting in the development of a customer-friendly solution that prioritized usability without compromising security standards.
  
### 2. <u>QEMU emulation model of the hetrocore RISC-V based HPSC system</u>
*Microchip Technology, Canada, 2023*

  Pioneered the development of the first QEMU model for a heterogeneous RISC-V based HPSC system, comprising an octo-core Application complex, system controller, and secure controller. This model enabled early customer engagement and accelerated application development for the HPSC platform.

  **Achievements**
  - Successfully engineered the first-ever QEMU model, providing a virtualized representation of the complex architecture of the HPSC system, thereby facilitating early customer engagement and fostering accelerated application development.
  - Implemented emulation of essential peripherals crucial for early boot and ROM development, ensuring comprehensive functionality and compatibility testing within a simulated environment.
  - Demonstrated technical proficiency and innovation in creating a robust and versatile QEMU model, laying the groundwork for efficient pre-silicon development and validation processes.

###	3. <u>Early-boot architecture for RISC-V based Linux and application software systems</u>
*Microchip Technology, Canada, 2023*

  Conceptualized, designed, and executed a robust early-boot architecture tailored to RISC-V based Linux and application software systems within the Multicore High-Performance Computing (HPSC) project. Integrated a dedicated boot manager subsystem and implemented early-boot functionality on QEMU and Protium emulation systems. Spearheaded the development of a new boot media and configuration controller, paving the way for future enhancements in boot architecture.

  **Achievements**
  -	Successfully designed, developed, and implemented a resilient early-boot architecture.
  -	Ensured compatibility and reliability by implementing early-boot functionality on diverse emulation systems.
  -	Led the development effort for a novel boot media and configuration controller integrating littleFS.
  -	Pioneered multi-Linux boot with system partitioning and boot management, optimizing system performance.

### 4. <u>Secure System ROM for HPSC</u>
*Microchip Technology, Canada, 2024*

  Designed and developed a robust and secure ROM for the system controller of the High-Performance Computing System (HPSC). Implemented a comprehensive security infrastructure to safeguard the integrity and confidentiality of the ROM.

  **Achievements**
  -	Successfully designed and developed a secure ROM solution tailored to the specific requirements of the HPSC.
  -	Implemented robust security measures to protect against unauthorized access, tampering, and exploitation.
  -	Collaborated closely with silicon design and verification teams to ensure seamless integration and compatibility with the overall system architecture.
  -	Delivered the secure system ROM on schedule, meeting all technical specifications and quality standards.

### 5. <u>Design and Development of Buildroot-Based Linux System for RISC-V based HPSC</u>
*Microchip Technology, Canada, 2023*

  Led the design and development efforts to create a buildroot-based Linux system tailored for the RISC-V based HPSC platform. Seamlessly integrated essential components and configurations to ensure optimal performance and compatibility with the unique architecture of the HPSC system. Spearheaded successful Linux bring-up on Protium and QEMU-based emulation systems, laying the foundation for comprehensive testing and validation procedures.

  **Achievements**
  - Designed and developed a robust buildroot-based Linux system, providing a stable and scalable foundation for the RISC-V based HPSC platform, thereby enhancing system functionality and user experience.
  - Executed successful Linux bring-up on Protium and QEMU-based emulation systems, demonstrating proficiency in system configuration and troubleshooting to ensure smooth operation across different environments.
  - Established a versatile buildroot-based framework, enabling the seamless integration and development of benchmark suites, middleware, and applications, thereby facilitating further innovation and expansion within the HPSC ecosystem.

### 6. <u>RISC-V Bespoke Debian Distro and Package Infrastructure for HPSC</u>
*Microchip Technology, Canada, 2023*

  Developed a bespoke RISC-V Debian distribution, "shellfire," for the RISC-V based HPSC Application complex. Additionally, implemented a private package repository to streamline the release of HPSC packages for the shellfire distribution, ensuring efficient access to essential software components.

  **Achievements**
  - Designed, developed, and managed the bespoke HPSC Debian distribution codenamed "shellfire".
  - Implemented robust build pipelines for seamless packaging of applications into Buildroot and apt packages from a common codebase, optimizing efficiency and reliability.
  - Pioneered a QEMU-based CI/CD framework for distribution and testing, enhancing the development processes.
  - Deployed and maintained the private repository hosting shellfire apt packages, enhancing system stability and usability for HPSC users.

### 7. <u>Software Release Infrastructure and Pipeline for First-Generation HPSC Project</u>
*Microchip Technology, Canada, 2022*


Led the architecture and implementation of a complete software release infrastructure and pipeline for the first-generation HPSC project collateral, aiming for efficient software release management and integration of DevOps practices.

  **Achievements**
  - Designed and implemented a low overhead, streamlined release pipeline automation, integrating CI/CD and code scan tools, enhancing development efficiency.
  - Established a live, versioned documentation infrastructure for effective management of updates and releases, ensuring availability of up-to-date, collaborative documentation for the HPSC project.  
  - Setup processes for release of both open-source and proprietary software, ensuring compliance with licensing requirements and facilitating dissemination of project collateral.
  - Implemented a GitHub-based customer access control and release management pipeline, optimizing collaboration and streamlining release workflow for internal and external stakeholders.
  
### 8. <u>Architecting Secure Solutions for Wireless IoT Products</u>
*Microchip Technology (India) Private Limited, Bangalore, 2021*

  Served as the IoT device security and Cloud unification architect, overseeing the development and implementation of robust security infrastructure for wireless IoT products. Led technical program management initiatives to ensure product security, guiding developers and customers in secure product development practices and designing secure cloud-connected embedded systems.

  **Achievements**
  - Conducted comprehensive analysis of existing Wi-Fi IoT device and system solutions, identifying and mitigating security vulnerabilities to enhance product resilience.
  - Provided expert guidance on secure product development methodologies, improving overall security posture.
  - Developed architecture for secure cloud-connected systems, establishing robust frameworks to safeguard data integrity and confidentiality in cloud environments.
  - Orchestrated secure personalization and provisioning implementations for IoT device production lines, ensuring lifecycle-wide integrity.
  - Architected a secure OTA firmware upgrade framework for PIC32WK family, enabling seamless updates to enhance functionality and security.
  - Architected a unified secure cloud mobile application connector for IoT and Cloud demos, streamlining integration efforts and ensuring a cohesive user experience.

### 9. <u>Applications Program Management for first generation Wi-Fi Silicon Product Line</u>
*Microchip Technology (India) Private Limited, Bangalore, 2021*

  As the Applications Lead, drove the development of innovative silicon features tailored for the IoT market in first-generation wireless IoT silicon products. Led post-silicon bring-up and validation efforts, engaging with customers to address field issues and design requirements. Conducted competitor analysis and collaborated with cross-functional teams for product competitiveness and market relevance.

  **Achievements**

  - Led post-silicon validation and technical program management for P32WK and P32MZ-W1 device families, ensuring successful product launches.
  - Designed new compiler features for P32WK and P32BL products, enhancing developer workflow efficiency for wireless IoT applications.
  - Developed drivers and test suites for non-wireless peripherals like PTG, CTR, and OTP-IPF, expanding silicon product capabilities.
  - Derived boot schemes and parameter security schemes for P32WK architecture, ensuring robust data protection and device integrity.
  - Collaborated with PCB design team to meet module market requirements, facilitating seamless integration of silicon products into IoT devices.
  - Ported basic peripheral drivers like SPI, I2C, USB, etc., ensuring compatibility with a wide range of peripheral devices.
  - Contributed to sales demos and cloud integration solutions for the IoT market, showcasing potential applications of the organic Wi-Fi silicon product line.

### 10. <u>Distributed secure voice cloud-based ecosystem</u>
*Microchip Technology (India) Private Limited, Bangalore, 2021*

  Led the architecture and implementation of a distributed serverless secure cloud model and firmware for voice-controlled system application deployment. Designed for seamless integration with Amazon Alexa and Google Home interfaces, aiming to create a low-cost, distributed cloud ecosystem for efficient product deployment.

  **Achievements**
  - Architected, implemented, and deployed a serverless distributed architecture on AWS, ensuring scalability, reliability, and security for the voice cloud-based ecosystem.
  - Prepared follow-up architectures for GCP and Azure, paving the way for potential multi-cloud deployments to enhance resilience and flexibility.
  - Developed web-based frontend tools for user onboarding, device registration, and management, improving user experience and streamlining setup and management processes.
  - Conducted firmware development and optimizations to ensure compatibility and efficiency of device-side firmware within voice-controlled systems.
  - Implemented REST APIs for mobile app integration and voice skills deployment, enabling seamless interaction between the cloud-based ecosystem and mobile applications, as well as facilitating deployment of voice-controlled skills and functionalities.


### 11. <u>Hardware in the loop Automation framework</u>
*Microchip Technology (India) Private Limited, Bangalore, 2021*

  As the architect and team manager, led the development of an advanced "hardware in the loop" automated system test framework project ("bumblebee"). This involved architecting and designing a comprehensive test harness using modern web-based tools and managing the implementation team to ensure timely delivery of releases to internal teams.

  **Achievements**

  - Established and led an implementation team, overseeing requirement gathering and technology selection to build an efficient system test harness.
  - Successfully secured funding for the implementation of the proposed architecture, ensuring adequate resources and tools for project execution.
  - Delivered releases and comprehensive packages with training material to cross-functional teams, facilitating seamless adoption and utilization of the automation framework.
  - Implemented an HTML and JS-based frontend integrated with a Python-based automation backend, enabling user-friendly interaction and robust automation capabilities for hardware in the loop testing.

### 12. <u>Development and integration of STB platform software</u>
  *CISCO, Bangalore, 2015*

  Contributed to the development of custom STB middleware modules and facilitated their integration with Linux drivers (CDI) for end-to-end integration, enhancing IPTV services with personalized features in multi-CPE-households and optimizing system-level performance.


  **Achievements**
  - Leveraged deep understanding of IPTV and broadcast protocols to drive development of custom STB middleware modules.
- Successfully integrated middleware components with device drivers and head-end systems for personalized features in multi-CPE-households.
- Executed integration of CableCARD into existing stack, ensuring compatibility and functionality within STB environment.
- Integrated components with Linux device drivers, optimizing system performance and functionality.
- Implemented NAT traversal on DOCSIS + Ethernet-based home networks for seamless device-head-end communication.
- Streamlined CPE-Headend communication for personalization features, ensuring efficient data exchange and synchronization.
- Developed framework for encrypted HTTP extensions for authenticated server communication, enhancing security and reliability.
- Prioritized system robustness and stability, ensuring seamless user experience throughout integration process.
- Designed and implemented automated build and test system, streamlining development processes and ensuring code quality.
- Developed RESTful web services for interaction with head-end server, enabling efficient data exchange and management.


### 13. <u>Development and Maturation of Nokia S40 USB Device and Host</u>
*Sasken communication Technologies ltd, Bangalore, 2011*

  Contributed to the development and maturation of low-level device drivers, protocol layers, and hardware abstraction layer (HAL) for USB on Nokia S40 running on NOS RTOS, aiming to enhance USB communication functionality and reliability on Nokia S40 devices.


  **Achievements**
  - Implemented new features to meet client requirements, continuously improving and customizing USB functionality on Nokia S40 devices.
  - Successfully resolved software and hardware bugs, enhancing stability and performance of USB communication.
  - Conducted forward and backward porting of drivers, ensuring compatibility across different versions of NOS RTOS and hardware platforms.
  - Managed certification-related maintenance tasks, ensuring compliance with industry standards and certifications for USB communication on Nokia S40 devices.


## MAJOR FREELANCE PROJECTS

### 1. <u>Design of FPGA-Based P-Radar Controller Architecture</u>

Led the design effort for the FPGA-based architecture of a P-Radar controller, aimed at implementing a standalone version of an existing mixed-mode, PC-based PR weather radar transceiver controller. This project focused on developing a robust micro-architecture design to integrate new and existing discrete modules provided by the client.

**Achievements**
  - Conducted a detailed study of the existing system implementation and available discrete components, gaining insights into the system requirements and technological constraints.
  - Investigated various platform options to determine the most suitable FPGA-based solution for the radar controller architecture, considering factors such as performance, scalability, and cost-effectiveness.
  - Designed a comprehensive micro-architecture that seamlessly integrated new and existing discrete modules, ensuring compatibility and functionality across the radar controller system.
  - Provided ongoing support and revision of modules and test plans during implementation and testing phases, ensuring the successful integration and validation of the FPGA-based radar controller architecture.

### 2. <u>Digital Control of Voltage Inverter Circuit</u>

Led the translation of Matlab-based digital subsystems into a real hardware implementation for digital control of a voltage inverter circuit. This project focused on converting theoretical models into practical, hardware-based solutions for efficient voltage control.

**Achievements**
  - Successfully gained a comprehensive understanding of the Matlab model representing power electronics principles and client requirements, ensuring alignment with project objectives.
  - Identified patterns between discrete channels from the Matlab model to generate optimized firmware, streamlining the translation process and enhancing the efficiency of the digital control system.
  - Designed and developed a prototype to demonstrate the ruggedness and functionality of the digital control system, including PCB design to ensure robustness and reliability in real-world applications.
  
### 3. <u>Patient Orientation Monitoring (PoC)</u>

Developed a proof of concept (PoC) system for patient orientation monitoring utilizing Linux-based software, MPU6050 sensors, and a web-based visualization interface. This project aimed to provide real-time monitoring of patient orientation and visualization of data for healthcare professionals.

**Achievements**

  - Implemented Linux-based patient orientation monitoring system using MPU6050 sensors, enabling accurate and real-time tracking of patient orientation.
  - Designed and developed a web-based visualization interface using WebGL and Three.js, allowing healthcare professionals to visualize patient orientation data in a user-friendly manner.
  - Developed Linux drivers and interfaces to facilitate seamless communication between the MPU6050 sensors and the monitoring system, ensuring reliable data acquisition and processing.
  - Successfully integrated the various components of the PoC system to create a comprehensive solution for patient orientation monitoring, demonstrating feasibility and effectiveness in healthcare settings.

### 4. <u> Implementation of Linux-Based Systems on Xilinx-MicroBlaze Full SoC Platforms</u>

Led the implementation of MicroBlaze soft processor-based systems on Xilinx Spartan 6 FPGA, specifically the lx9 micro board. This project involved board bring-up, custom Linux kernel bring-up, designing and implementing various peripherals for the System-on-Chip (SoC) in Verilog, and developing drivers and software adaptation layers for the system.

**Achievements**
- Successfully implemented MicroBlaze soft processor-based systems on Xilinx Spartan 6 FPGA, demonstrating expertise in FPGA-based system design.
- Conducted board bring-up activities to ensure proper functionality and compatibility with the custom Linux kernel, laying the foundation for system development.
- Designed and implemented various peripherals for the SoC in Verilog, enhancing the functionality and versatility of the system.
- Developed drivers and software adaptation layers to facilitate seamless integration of peripherals with the Linux-based system, ensuring efficient operation and compatibility.
- Demonstrated proficiency in system-level design and integration, culminating in the successful deployment of Linux-based systems on Xilinx-MicroBlaze full SoC platforms.

### 5. <u> USB-Based Authentication Token for Custom Software</u>

Led the design and implementation of a USB-based authentication token for custom software, incorporating PIC 18f4550 microcontroller for end-to-end (E2E) USB hardware design of the authentication token. Developed a Visual Basic-based software design for a simple authenticated notepad demo application, incorporating two-phase security with passcode and hardware-based authentication.

**Achievements**
- Designed the hardware architecture for the USB-based authentication token utilizing PIC 18f4550 microcontroller, ensuring end-to-end USB connectivity and secure authentication.
- Implemented a visual basic-based software design for a simple authenticated notepad demo application, demonstrating proficiency in software development for custom authentication systems.
- Integrated two-phase security measures into the authentication token system, combining passcode and hardware-based authentication methods to enhance security and protect sensitive data.
- Ensured seamless communication and compatibility between the hardware authentication token and the software application, enabling secure access and authentication for authorized users.
- Successfully demonstrated the functionality and reliability of the USB-based authentication token system, providing a robust solution for secure software authentication.

### 6. <u> Messaging Mechanisms for Digital Radar Control Systems</u>


Led the development of messaging mechanisms for digital radar control systems, implementing XML-based messaging for multi-location radar controllers. Enhanced XMPP for collaborative networks and incorporated encrypted message bodies for heightened security over TLS, serving as a stepping stone to the Internet of Things (IoT) for radar systems.

**Achievements**
  - Developed an XML-based messaging mechanism to facilitate communication among multi-location radar controllers, ensuring efficient data exchange and coordination.
  - Enhanced XMPP for collaborative networks, enabling real-time communication and collaboration among radar operators and stakeholders across different locations.
  - Implemented encrypted message bodies over TLS to enhance the security of communication channels, safeguarding sensitive radar data from unauthorized access and interception.
  - Positioned the messaging mechanisms as a stepping stone to the Internet of Things (IoT) for radar systems, laying the foundation for future integration with IoT technologies and platforms.
  - Demonstrated proficiency in designing and implementing advanced messaging solutions for digital radar control systems, enhancing interoperability, security, and collaboration capabilities.

### 7. <u> Custom Daughter-Card for Raspberry Pi</u>

Led the end-to-end design and fabrication of a custom daughter-card for Raspberry Pi, incorporating a PIC microcontroller-based PCB. Established I2C and GPIO-based communication with the daughter-card and developed a custom Linux build with minimal BusyBox Root File System (RFS). Designed and implemented custom kernel modules for daughter-card control and proposed an I2C bootloader and Linux drivers for firmware upgrade to eliminate ICSP.

**Achievements**
  - Successfully designed and fabricated a custom daughter-card for Raspberry Pi, integrating a PIC microcontroller-based PCB to expand functionality.
  - Established robust I2C and GPIO-based communication protocols between the Raspberry Pi and the daughter-card, ensuring seamless data exchange and control.
  - Developed a custom Linux build with minimal BusyBox Root File System (RFS), optimizing resource usage and enhancing system performance.
  - Designed and implemented custom kernel modules to enable control and management of the daughter-card functionalities within the Linux environment.
  - Proposed an innovative solution for firmware upgrade using an I2C bootloader and Linux drivers, eliminating the need for ICSP and simplifying the upgrade process for enhanced efficiency and convenience.


## ACADEMIC PROJECTS

### 1. <u>H/W-S/W Co-design of a Web Interface for FPGA-Based Radar Control Systems</u>

Undertook a postgraduate project focusing on the hardware-software co-design of a web interface for FPGA-based radar control systems. This project aimed to design and implement a standalone radar control configuration unit based on a MicroBlaze soft-core processor, utilizing LWIP and Xilkernel for implementing HTTP over TCP/IP. Principles of hardware-software co-design were applied to ensure parallel and efficient development of both hardware and software components.

**Achievements**
  - Designed and implemented a standalone radar control configuration unit utilizing a MicroBlaze soft-core processor, providing the necessary processing power for radar control functionalities.
  - Developed a system based on LWIP and Xilkernel to implement HTTP over TCP/IP, enabling communication between the radar control system and external devices via a web interface.
  - Utilized hardware-software co-design principles to parallelize the development of hardware and software components, ensuring efficient utilization of resources and optimizing system performance.
  - Successfully integrated hardware and software components to create a cohesive system for radar control, demonstrating proficiency in both FPGA-based hardware design and software development.
  - Presented findings and outcomes of the project as part of the academic curriculum, contributing to the advancement of knowledge in the field of H/W-S/W co-design for radar control systems.


### 2. <u>BioMedical Kit for the OLPC XO</u>

Collaborated with the Department of Electrical and Computer Engineering, University of Texas, Austin (USA), to design and implement an educational biomedical kit for the One Laptop Per Child (OLPC) XO platform. This project aimed to develop a comprehensive educational tool for students, incorporating in-house developed sensors such as ECG, Blood Oximeter, and Body Temperature sensors. Vital signals were digitized, collected, and transmitted over USB to the OLPC XO for processing. The graphical user interface (GUI) was developed using Adobe Flex, providing an interactive and user-friendly experience for students. Embedded error control mechanisms were implemented to ensure reliable data acquisition and processing, enhancing the educational value of the kit.

**Achievements**
  - Successfully collaborated with the Department of Electrical and Computer Engineering, University of Texas, Austin (USA), to develop an innovative educational tool for the OLPC XO platform.
  - Results and design Published in the International Journal of Telemedicine and e-Health : [10.1089/tmj.2011.0017](10.1089/tmj.2011.0017)
  - Designed and implemented in-house developed sensors, including ECG, Blood Oximeter, and Body Temperature sensors, providing students with hands-on experience in biomedical data acquisition.
  - Developed a robust data processing system to digitize vital signals collected by the sensors and transmit them over USB to the OLPC XO for analysis.
  - Created an intuitive graphical user interface (GUI) using Adobe Flex, enhancing the user experience and facilitating interactive learning for students.
  - Implemented embedded error control mechanisms to ensure reliable data acquisition and processing, improving the accuracy and reliability of the educational biomedical kit.
  - Contributed to the advancement of Indo-US academic collaboration through the successful completion of the project, fostering knowledge exchange and innovation in biomedical education.


## PUBLICATIONS

1. 	In-depth technical blogs at [embeddedinn.com](https://www.embeddedinn.com)
2. 	Various Application Notes & Whitepapers are available on the Microchip website, Knowledge base and [GitHub](https://github.com/vppillai)
3.	"Low-Cost Remote Patient Monitoring System based on Reduced Platform Computer technology" – Nevin Alex Jacob, Vysakh P Pillai et all. - International Journal of telemedicine and e-health (peer-reviewed journal) - September 2011, 17(7): 536-545. DOI:10.1089/tmj.2011.0017
4. 	“Innovation motivation” Published in Sasken internal knowledge sharing archives


## OTHER ACTIVITIES

-	20+ talks technical talks delivered on various platforms including IEEE and ACM conferences. 
-	Industry expert member, Board of Studies for Electronics and Computer Engineering, Amrita School of Engineering.
-	Ex-member of the board of directors, Save My Ten Foundation (NGO) 

## KEY INVITED TALKS & PRESENTATIONS
- Emerging Trends in IOT EDGE Intelligence (Amrita University, Aug-2021)
- Embedded Systems in The Age of IOT And AI (Amrita University, Nov-2020)
- Python for cloud and embedded systems at Vidyuth ’20 (Amrita University, Feb-2020)
- Workshop: Cloud-connected robotics at “Robotsavam“, Kerala (IEEE, July-2017)
- Workshop: IoT infrastructures at ISEE, Kerala (IEEE, Aug-2016)  
- Workshop: Networking in the IoT era at ISEE, Kerala (IEEE, July-2015) 
- Workshop: Introducing IoT to beginners at ISEE, Kerala (IEEE, July-2014)  
- 2-day Workshop on Introduction to Linux with Raspberry Pi at Vidyuth 2014 (IEEE, Feb14)
- Workshop on Introduction to embedded multitasking at ISEE, Kerala (IEEE, July-2013)
- Talk on FPGA based programmable system design at Amrita University (March 2013)
- Tutorial session on UPnP (in-depth) at NDS Pay-TV Solutions Ltd
- Presentation on USB 3.0 (in-depth) at Sasken Communication Technologies Ltd
- Faculty Development Program on the topic ‘Rapid Prototyping for Embedded DSP Engineers and System Architects’ at Amrita University. (Winter 2009)

