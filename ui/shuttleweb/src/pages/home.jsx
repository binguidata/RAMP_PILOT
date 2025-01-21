import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from "@material-ui/core";

import { Sidebar } from "../components/sidebar";
import '../styles/style.css';


export function Home() {
    return (
        <Container maxWidth="xl">
            <Sidebar/>
            <div>
                <a className='home-image'>
                    <img 
                        alt="RAMP logo"
                        src="/RAMP_logo.png"
                        width={'85%'}
                    />
                </a>
                <div className='home-text' style={{ width: '85%', marginLeft: 'auto', marginRight: 'auto' }}>
                    <p style={{ fontSize: '40px', fontWeight: 'bold', marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
                        As of September 6th, the RAMP program has officially come to an end. We appreciate your participation and support throughout its duration.
                    </p>
                    <p style={{ fontSize: '40px', fontWeight: 'bold', marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
                        We are actively pursuing additional funding to continue this program.
                    </p>
                </div>
                <div className='home-text' style={{ width: '85%', marginLeft: 'auto', marginRight: 'auto' }}>
                    <p style={{ marginTop: '20px' }}>
                        <span style={{ fontWeight: 'bold' }}>Carnegie Mellon University (CMU)</span> is leading a research project aimed at improving transportation systems in rural areas, with a focus on southwestern Pennsylvania. 
                        The project aims to advance knowledge on energy-efficient and affordable mobility services for rural America. As part of this effort, <span style={{ fontWeight: 'bold' }}>CMU</span> has initiated a pilot program in <span style={{ fontWeight: 'bold' }}>Greene County</span> called the Rural Access Mobility Platform (RAMP). 
                        Funded by Pennsylvania’s Department of Energy, RAMP is a collaborative endeavor involving <span style={{ fontWeight: 'bold' }}>CMU</span>, <span style={{ fontWeight: 'bold' }}>Blueprints</span>, <span style={{ fontWeight: 'bold' }}>Greene County</span>, and <span style={{ fontWeight: 'bold' }}>Waynesburg University</span>. The program seeks to enhance transportation efficiency and accessibility for essential needs across the county. 
                        During the trial period, the project will gather valuable data to help the community identify sustainable solutions and secure long-term financial support for addressing transportation challenges.
                    </p>
                    <Link to="/faq" style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', fontWeight: 'bold' }}>Q&A</Link>
                </div>
            </div>
            <br/>
            <br/>
        </Container>
    );
}
