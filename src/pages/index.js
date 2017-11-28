import React from 'react'
import Link from 'gatsby-link'

const IndexPage = () => (
  <div>
    <h1>Hi people</h1>
    <p>Welcome to your new Gatsby site.</p>
    <p>Now go build something great.</p>
    <Link to="/page-2/">Go to page 2</Link>
		<div>
			<a href="/org-structure">Go to org</a>
		</div>
		<div>
			<a href="/payments">Go to Payments</a>
		</div>
  </div>
)

export default IndexPage
