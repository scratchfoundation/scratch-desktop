import React from 'react';
import ReactDOM from 'react-dom';

import styles from './privacy.css';

// TODO: localization?
const PrivacyElement = () => (
    <div className={styles.privacyBox}>
        <h1>Privacy Policy</h1>
        <p>
            We understand how important privacy is to our community, especially children and their parents. We wrote
            this privacy policy to explain what information we collect through the Scratch application (the
            &ldquo;App&rdquo;), how we use it, and what we&apos;re doing to keep it safe. If you have any questions
            regarding this privacy policy, you can <a href="https://scratch.mit.edu/contact-us">contact us</a>.
        </p>
        <h2>What information does the App collect?</h2>
        <p>
            The Scratch Team is always looking to better understand how Scratch is used around the world. To help
            support this effort, Scratch only collects anonymous usage information from the Scratch App. This
            information does not include any Personal Information. For purposes of this Privacy Policy, &ldquo;Personal
            Information&rdquo; means any information relating to an identified or identifiable individual.
        </p>
        <p>
            The anonymous usage information we collect includes data about what parts of the app you use and basic
            information about your network that allows us to roughly estimate what part of the world you are located
            in. We also may collect general information about the device that you are using, such as make, model,
            operating system and screen resolution. We do not collect device identifiers, such as advertising IDs, MAC
            addresses, or IP addresses. We do not associate any of this information with an identified or identifiable
            individual.
        </p>
        <h2>How does the Scratch Team use the information it collects?</h2>
        <ul>
            <li>
                We may use anonymous usage information in research studies intended to improve our understanding of how
                people learn with Scratch. The results of this research are shared with educators and researchers
                through conferences, journals, and other publications.
            </li>
            <li>
                We analyze the information to understand and improve Scratch, such as determining which elements are
                most used and how long users spend in the app.
            </li>
            <li>
                We will never share anonymous usage data with any other person, company, or organization, except:
                <ul>
                    <li>
                        As required to comply with our obligations under the law
                    </li>
                    <li>
                        For technical reasons, if we are required to transfer the data on our servers to another
                        location or organization
                    </li>
                </ul>
            </li>
        </ul>
    </div>
);

const appTarget = document.getElementById('app');
ReactDOM.render(<PrivacyElement />, appTarget);
