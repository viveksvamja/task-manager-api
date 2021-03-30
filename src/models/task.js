const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    }
}, {
    timestamps: true
});

// Middleware/ Observer called before save
taskSchema.pre('save', async function(next) {
    task = this
    console.log('Middleware triggers for task save')
    next()
})

const Task = mongoose.model('Task', taskSchema)


module.exports = Task