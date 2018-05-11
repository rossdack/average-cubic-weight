import React, {Component} from 'react';
import axios from 'axios';
import './App.css';

const cubicWeightFactor = 250;
const requiredItemType = 'Air Conditioners';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPage: '/api/products/1',
            numItems: 0,
            numRequiredItems: 0,
            totalActualWeight: 0,
            totalCubicWeight: 0,
            error: false
        }
    }

    fetchItems(page) {
        const dataUrl = 'http://wp8m3he1wt.s3-website-ap-southeast-2.amazonaws.com' + page;
        return axios.get(dataUrl)
    }

    /**
     * Calculate cubic weight.
     * Assumes (as per spec) the supplied dimensions are in CM
     * so we convert this into meters (/100)
     * @returns {number}
     */
    calculateCubicWeight(productSpec) {
        if (productSpec.width && productSpec.length && productSpec.height) {
            return ((productSpec.width / 100) *
                (productSpec.length / 100) *
                (productSpec.height / 100)) *
                cubicWeightFactor;
        } else {
            console.error('Missing product dimension for ' + productSpec.title);
            this.setState.error = true;
        }
    }

    /**
     * Filter items
     * @param items
     * @returns {*}
     */
    filterItems(items) {
        const filteredItems = items.filter(function (anItem) {
            return anItem.category === requiredItemType;
        });
        return filteredItems;
    }

    /**
     * Process date from REST
     * @param page
     */
    getData(page) {
        console.log('Current page is ', page);
        let aTotalActualWeight = 0;
        let aNumRequiredItems = 0;
        let aTotalCubicWeight = 0;
        let aIterationTotal = 0;

        this.fetchItems(page).then(result => {
            if (result && result.data && result.data.objects) {
                aIterationTotal = this.state.numItems + result.data.objects.length;

                let filteredItems = this.filterItems(result.data.objects);

                filteredItems.forEach(function (productSpec) {
                    aTotalActualWeight += productSpec.weight;
                    aNumRequiredItems++;
                    aTotalCubicWeight += this.calculateCubicWeight(productSpec.size);
                }.bind(this));
                this.setState({
                    numItems: aIterationTotal,
                    totalActualWeight: aTotalActualWeight + this.state.totalActualWeight,
                    numRequiredItems: aNumRequiredItems + this.state.numRequiredItems,
                    totalCubicWeight: aTotalCubicWeight + this.state.totalCubicWeight,
                    currentPage: (result.data.next ? result.data.next : null)
                });
            }
        }).catch(failure => {
            console.debug('Something bad happened talking to AWS', failure);
        });
    }

    componentDidMount() {
        this.getData(this.state.currentPage);
    }

    componentWillUpdate(nextProps, nextState) {
        if (nextState.currentPage === this.state.currentPage || nextState.currentPage == null) {
            console.log('No next page');
        } else {
            this.getData(nextState.currentPage);
        }
    }

    render() {
        return (
            <div className="App">
                <h1 className="App-title">Average Cubic Weight</h1>

                <p className="App-intro">
                    <span>Total number of all items: {this.state.numItems}</span>
                </p>
                <ul>
                    For <b>{requiredItemType}</b>:
                    <li>Total number of items: {this.state.numRequiredItems}</li>
                    <li>Total actual weight: {this.state.totalActualWeight} Kg</li>
                    <li>Total cubic weight: {this.state.totalCubicWeight.toFixed(2)} Kg</li>
                    <li>Average cubic
                        weight: {(this.state.totalCubicWeight / this.state.numRequiredItems).toFixed(2)} Kg
                    </li>
                </ul>
            </div>
        );
    }
}

export default App;
